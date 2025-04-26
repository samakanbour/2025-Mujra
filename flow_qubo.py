"""
Risk-aware drainage-network QUBO generator **and solver** (multi-bit flows, generic graph)
===============================================================================
This self-contained script
• builds the QUBO/Ising encoding of the risk-aware drainage problem for **any** directed graph,
• optionally **solves** it (exact classical eigensolver or QAOA), and
• prints / saves the resulting *edge flows*.

Call pattern
------------
```
python main.py  problem.json [--out qubo.lp] [--solve exact|qaoa] \
                                         [--shots 1024] [--seed 123]
```
* `problem.json` - see bottom for schema.
* `--solve exact`   : uses `NumPyMinimumEigensolver`  (good ≤20 qubits)
* `--solve qaoa`    : 2-layer QAOA + COBYLA, backend = sampler simulator.
* omit `--solve`    : just export the LP/QUBO.

Returned on stdout
------------------
A table like:
```
Solved - objective = -7.25
Edge        flow (m3/s)
A->B        1.0
B->C        0.0
B->D        2.0
C->D        1.0
```

File layout & JSON schema
-------------------------
```jsonc
{
  "edges"         : [["A","B"],["B","C"], ...],          // directed
  "node_capacity" : {"A":4, ...},                        // c_i
  "node_risk"     : {"A":0.2, ...},                      // r_i ∈ [0,1]
  "pipe_capacity" : {"A,B":3, ...},                      // e_ij
  "energy_cost"   : {"A,B":1.2, ...},                    // I_ij
  // optional tweaks
  "bits"          : 3,
  "delta"         : 0.5,
  "lambda"        : 0.3,
  "energy_budget" : 8
}
```

Dependencies
------------
```
pip install networkx docplex "qiskit-optimization>=0.6" qiskit_algorithms
```

"""
from __future__ import annotations

import argparse, json, math, pathlib, re, sys
from typing import Any, Dict, Iterable, Tuple, Union

import matplotlib.pyplot as plt
import matplotlib.cm as cm
import networkx as nx  # optional
from docplex.mp.model import Model
from qiskit_optimization.translators import from_docplex_mp
from qiskit_optimization import QuadraticProgram, algorithms as opt_alg
from qiskit_algorithms import NumPyMinimumEigensolver, QAOA
from qiskit_algorithms.optimizers import COBYLA
# from qiskit.primitives import StatevectorSampler
from qiskit.primitives import Sampler

Node = Any
Edge = Tuple[Node, Node]

###############################################################################
# QUBO builder (unchanged semantics)
###############################################################################

def build_qubo(
    graph: Union["nx.DiGraph", Iterable[Edge]],
    node_capacity: Dict[Node, float],
    node_risk: Dict[Node, float],
    pipe_capacity: Dict[Edge, float],
    energy_cost: Dict[Edge, float],
    *,
    bits_per_edge: int = 3,
    flow_quantum: float = 1.0,
    λ: float = 0.5,
    penalty_node: float = 8.0,
    penalty_pipe: float = 8.0,
    penalty_energy: float = 8.0,
    energy_budget: float | None = None,
    name: str = "risk_aware_dr",
) -> Tuple[QuadraticProgram, Dict[str, Tuple[Edge, int, float]]]:
    """Build QUBO and return (QuadraticProgram, var_map).

    var_map maps *variable name* → (edge, bit_index, flow_quantum*2**bit).
    It is later used to reconstruct physical flows from a binary solution.
    """

    # canonicalise edge list -------------------------------------------------
    if nx and isinstance(graph, nx.DiGraph):
        edges: Tuple[Edge, ...] = tuple(graph.edges)
    else:
        edges = tuple((u, v) for u, v in graph)

    nodes = {n for e in edges for n in e}

    # sanity checks ----------------------------------------------------------
    if (missing := nodes - node_capacity.keys()):
        raise ValueError(f"missing capacities for {missing}")
    if (missing := nodes - node_risk.keys()):
        raise ValueError(f"missing risks for {missing}")
    if (missing := set(edges) - pipe_capacity.keys()):
        raise ValueError(f"missing pipe caps for {missing}")
    if (missing := set(edges) - energy_cost.keys()):
        raise ValueError(f"missing energy cost for {missing}")

    mdl = Model(name=name, ignore_names=True)
    
    var_map: Dict[str, Tuple[Edge, int, float]] = {}

    # binary vars x_e_k ------------------------------------------------------
    def add_binary(e: Edge, k: int):
        vname = f"x_{e[0]}_{e[1]}_{k}"
        var = mdl.binary_var(name=vname)
        var_map[vname] = (e, k, (2 ** k) * flow_quantum)
        return var

    x = {(e, k): add_binary(e, k) for e in edges for k in range(bits_per_edge)}

    def flow_expr(e: Edge):
        return mdl.sum((2 ** k) * x[(e, k)] for k in range(bits_per_edge)) * flow_quantum

    # objective --------------------------------------------------------------
    
    # obj = mdl.constant(0)
    obj = 0
    for e in edges:
        u, v = e
        weight = (1 - 0.5 * λ * (node_risk[u] + node_risk[v])) * flow_quantum
        obj -= weight * mdl.sum((2 ** k) * x[(e, k)] for k in range(bits_per_edge))

    for n in nodes:
        inflow = mdl.sum(flow_expr(e) for e in edges if e[1] == n)
        outflow = mdl.sum(flow_expr(e) for e in edges if e[0] == n)
        obj += penalty_node * (inflow - node_capacity[n]) ** 2
        obj += penalty_node * (outflow - node_capacity[n]) ** 2

    for e in edges:
        obj += penalty_pipe * (flow_expr(e) - pipe_capacity[e]) ** 2

    if energy_budget is not None:
        totE = mdl.sum(energy_cost[e] * flow_expr(e) for e in edges)
        obj += penalty_energy * (totE - energy_budget) ** 2

    mdl.minimize(obj)

    qp = from_docplex_mp(mdl)
    return qp, var_map

###############################################################################
# Solver helpers
###############################################################################

def solve_qp(qp: QuadraticProgram, method: str = "exact", shots: int = 1024, seed: int | None = None):
    if method == "exact":
        eig = NumPyMinimumEigensolver()
        solver = opt_alg.MinimumEigenOptimizer(eig)
    elif method == "qaoa":
        qaoa = QAOA(sampler=Sampler(), reps=2, optimizer=COBYLA())
        solver = opt_alg.MinimumEigenOptimizer(qaoa)
    else:
        raise ValueError("method must be 'exact' or 'qaoa'")
    return solver.solve(qp)


def flows_from_result(result, var_map: Dict[str, Tuple[Edge, int, float]]):
    flows: Dict[Edge, float] = {}
    
    # Create a list of var_map items to map indices to original variables
    var_map_items = list(var_map.items())
    
    # Debug information
    if any(name.startswith('x') and name[1:].isdigit() for name in result.variables_dict.keys()):
        print("Info: Using indexed variables mapping")
    
    for name, value in result.variables_dict.items():
        if value > 0.5:  # binary 1
            # For variable names like 'x0', 'x1', etc., extract the index
            if name.startswith('x') and name[1:].isdigit():
                idx = int(name[1:])
                if 0 <= idx < len(var_map_items):
                    orig_name, (e, _, weight) = var_map_items[idx]
                    flows[e] = flows.get(e, 0.0) + weight
                    print(f"Mapped {name} (value={value}) to {orig_name}: edge={e}, weight={weight}")
            # For original variable names if they exist in the result
            elif name in var_map:
                e, _, weight = var_map[name]
                flows[e] = flows.get(e, 0.0) + weight
                print(f"Direct match for {name}: edge={e}, weight={weight}")
    
    return flows


def draw_solution(G: nx.DiGraph, flows: Dict[Edge, float], node_cap: Dict[Node, float], pipe_cap: Dict[Edge, float]):
    # compute utilisation ratios -------------------------------------------
    edge_util = {e: min(flows.get(e, 0.0) / pipe_cap[e], 1.0) for e in G.edges}
    node_util: Dict[Node, float] = {n: 0.0 for n in G.nodes}
    for n in G.nodes:
        used = sum(flows.get(e, 0.0) for e in G.in_edges(n))
        node_util[n] = min(used / node_cap[n], 1.0) if node_cap[n] else 0.0

    # layout & colours ------------------------------------------------------
    pos = nx.spring_layout(G, seed=42)
    nodes = nx.draw_networkx_nodes(
        G, pos,
        node_color=[cm.RdYlGn(util) for util in node_util.values()],
        node_size=600,
    )
    nx.draw_networkx_labels(G, pos, font_size=10, font_color="black")

    # edges
    widths = [1 + 4 * edge_util[e] for e in G.edges]
    colors = [cm.RdYlGn(1-edge_util[e]) for e in G.edges]
    nx.draw_networkx_edges(G, pos, width=widths, edge_color=colors, arrows=True, arrowstyle="-|>")

    # edge labels (flow / capacity)
    lbls = {e: f"{flows.get(e, 0):.1f}/{pipe_cap[e]:.1f}" for e in G.edges}
    nx.draw_networkx_edge_labels(G, pos, edge_labels=lbls, font_size=8)

    plt.axis("off")
    plt.title("Network Optimization Solution - utilisation (edge: flow / capacity)")
    plt.show()

###############################################################################
# CLI
###############################################################################

def main(argv=None):
    p = argparse.ArgumentParser(description="Build QUBO for risk-aware drainage and optionally solve it.")
    p.add_argument("NETWORK_CONFIG", type=pathlib.Path)
    p.add_argument("--out", type=pathlib.Path, default=None, help="LP/QUBO output filename")
    p.add_argument("--solve", choices=["exact", "qaoa"], help="solve the QUBO using given backend")
    p.add_argument("--shots", type=int, default=1024, help="sampler shots for QAOA")
    p.add_argument("--viz", action="store_true", help="plot network with utilisation colours")
    p.add_argument("--seed", type=int, default=None, help="random seed")
    args = p.parse_args(argv)
    
    def tuple_keys(d):
        return {tuple(k.split(',')): v for k, v in d.items()} if all(isinstance(k, str) for k in d) else d

    data = json.loads(args.NETWORK_CONFIG.read_text())
    # pipe_capacity = {tuple(key): val for key, val in data["pipe_capacity"].items()}
    data['pipe_capacity'] = {tuple(key.split(',')): val for key, val in data["pipe_capacity"].items()}
    data['energy_cost'] = {tuple(key.split(',')): val for key, val in data["energy_cost"].items()}
    G = nx.DiGraph(data["edges"]) if nx else data["edges"]

    qp, vmap = build_qubo(
        G,
        data["node_capacity"],
        data["node_risk"],
        data["pipe_capacity"],
        data["energy_cost"],
        bits_per_edge=data.get("bits", 3),
        flow_quantum=data.get("delta", 1.0),
        λ=data.get("lambda", 0.5),
        energy_budget=data.get("energy_budget"),
    )

    if args.out:
        args.out.write_text(qp.export_as_lp_string())
        print(f"LP/QUBO written to {args.out}")

    flows = {}
    if args.solve:
        res = solve_qp(qp, args.solve, seed=args.seed)
        flows = flows_from_result(res, vmap)
        print(f"Objective = {res.fval:.3f}\nEdge        flow")
        for e, f in sorted(flows.items()):
            print(f"{e[0]}->{e[1]:<4} {f}")
    
    if args.viz:
        if not flows:
            print("[warn] nothing to plot - solve first or provide flows", file=sys.stderr)
        else:
            draw_solution(G, flows, data["node_capacity"], tuple_keys(data["pipe_capacity"]))


if __name__ == "__main__":
    main()
