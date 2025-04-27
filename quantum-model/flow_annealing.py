"""Quick-start script: run the drainage QUBO on D-Wave Advantage.

Requirements
------------
$ pip install dwave-ocean-sdk networkx qiskit-optimization docplex

Usage
-----
$ export DWAVE_API_TOKEN="<your-token>"
$ python run_on_dwave.py toy_problem.json

The script
1. loads the JSON problem description (same schema as before),
2. builds the QuadraticProgram with *risk_aware_drainage_qubo.py* (must be in PYTHONPATH),
3. converts it to a **dimod BinaryQuadraticModel**,
4. sends it to the cloud sampler (`DWaveSampler` + `EmbeddingComposite`),
5. prints the best sample and corresponding edge flows.
"""
from __future__ import annotations

import json, pathlib, sys, collections
from typing import Dict, Tuple, Any

import networkx as nx
from qiskit_optimization.translators import from_docplex_mp
from qiskit_optimization.converters import QuadraticProgramToQubo
from qiskit_optimization import QuadraticProgram
import dimod
from dwave.system import DWaveSampler, EmbeddingComposite

# ---- import the builder from the previous module --------------------------
from flow_qubo import build_qubo, flows_from_result

# ---------------------------------------------------------------------------
# helper: convert QuadraticProgram -> dimod.BQM
# ---------------------------------------------------------------------------

def qp_to_bqm(qp: QuadraticProgram) -> dimod.BinaryQuadraticModel:
    # ensure it's a pure QUBO (quadratic + linear, minimisation)
    qp_qubo = QuadraticProgramToQubo().convert(qp)
    linear  = {v.name: coeff for v, coeff in qp_qubo.objective.linear.to_dict().items()}
    quad    = { (qp_qubo.variables[i].name, qp_qubo.variables[j].name): coeff
                for (i,j), coeff in qp_qubo.objective.quadratic.to_dict().items() }
    bqm = dimod.BinaryQuadraticModel(linear, quad, qp_qubo.objective.constant, dimod.BINARY)
    return bqm

# ---------------------------------------------------------------------------
# main
# ---------------------------------------------------------------------------

def main():
    if len(sys.argv) < 2:
        print("usage: python run_on_dwave.py problem.json")
        sys.exit(1)

    data_path = pathlib.Path(sys.argv[1])
    data = json.loads(data_path.read_text())

    # convert dictionaries with "U,V" keys to tuple keys ---------------
    def keys_to_tuple(d):
        return {tuple(k.split(',')) if isinstance(k, str) else k: v for k, v in d.items()}

    G = nx.DiGraph(data["edges"])
    qp, var_map = build_qubo(
        G,
        data["node_capacity"],
        data["node_risk"],
        keys_to_tuple(data["pipe_capacity"]),
        keys_to_tuple(data["energy_cost"]),
        bits_per_edge=data.get("bits", 3),
        flow_quantum=data.get("delta", 1.0),
        λ=data.get("lambda", 0.5),
        energy_budget=data.get("energy_budget"),
    )

    # build BinaryQuadraticModel ---------------------------------------
    bqm = qp_to_bqm(qp)

    # --- sample on D-Wave ---------------------------------------------
    sampler = EmbeddingComposite(DWaveSampler())
    sampleset = sampler.sample(bqm, num_reads=100, label="Drainage optimisation")
    best = sampleset.first.sample
    energy = sampleset.first.energy

    # reconstruct edge flows -------------------------------------------
    result_dict = {n: int(v) for n, v in best.items()}
    # wrap into a mock Result object expected by flows_from_result
    class _Res:  # minimal stub
        variables_dict = result_dict
    flows = flows_from_result(_Res, var_map)

    print("Solved via D-Wave - energy", energy)
    print("Edge          flow")
    for (u,v), f in sorted(flows.items()):
        print(f"{u}->{v:<4}    {f}")

if __name__ == "__main__":
    main()
