# NYUAD International Hackathon for Social Good in the Arab World: Quantum Computing (QC) and Artificial Intelligence (AI)

# Mujra: Urban Drainage Network Topology Optimizer

## Introduction
The مجرى is an urban drainage network topology optimizer that helps cities reduce the risk of flooding, overflows, and inefficiencies in aging drainage systems. It combines hybrid quantum-classical algorithms with AI to deliver real-time optimization and visualization of water flow.

![alt text](https://ars.els-cdn.com/content/image/1-s2.0-S0043135421010976-gr3_lrg.jpg)

## Demo
https://github.com/basil-ahmed/QMorjan-team17/assets/90772853/2f5a1e15-c5d4-490a-91b2-c51f10dfacda


## Background

Drainage networks are critical for urban resilience and public health, but are increasingly strained by climate change and urbanization. Mujra uses advanced algorithms to identify the most effective intervention points within the network and leverages quantum computing to optimize drainage flow and restoration strategies.


## Presentation

[Presentation](https://docs.google.com/presentation/d/1QvU6STsqRpExncq30ouulwNxy55LFzJAiTKUcZwIlGQ/edit?slide=id.g120cbbff307_0_0#slide=id.g120cbbff307_0_0)

## Quantum Computing Model & Classical Computer Vision Model

The classical computer vision (CV) model uses unsupervised learning with Gaussian Mixture Models (GMM) for real-time detection of drainage networks from UAE digital elevation models. The Quantum model employs Quantum Annealing to solve the Set Cover Problem for determining optimal coral repopulation points.

## Tech Stack

- QUBO/QAOA
- VQLS
- DQI
- qBraid
- D-Wave Ocean SDK
- Python 3.8+
- OpenCV
- scikit-learn
- numpy
- AWS


## Installation

```bash
git clone https://github.com/your_github_username/mujra.git
```

Ensure you have access to a quantum computing service like D-Wave through qBraid.

```bash
git clone https://github.com/your_github_username/qmarjan.git
```

## Usage

```bash
python drainage_detection.py --image_path /path/to/satellite/image
```

The model requires an input graph representation of detected coral reefs from the Classical CV Model.

```bash
python bitmap_things.ipynb.py --graph_path /path/to/coral_graph
```

## Output

The quantum algorithm generates a set of points representing the optimal locations for drainage network interventions. The model outputs a visual map highlighting critical sections of the drainage system, along with a CSV file containing the coordinates of the identified areas.


## Data Visualization

All generated images (model output) are present in this repository.


## Roadmap

- 6 months: Product validation with UAE MOCCAE and the "Dubai Reef" project.
- 3+ years: Scale to 15+ countries with separate data management systems and bleaching forecasting.


## Acknowledgments

A special thanks to the students, mentors and judges involved in the Mujra project, including those from NYUAD, Oxford, MIT, Google, GE and other institutions. We welcome contributions from the community.


## License

This project is licensed under the NYUAD License - see the `LICENSE` file for details.
