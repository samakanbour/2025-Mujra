# NYUAD International Hackathon for Social Good in the Arab World: Quantum Computing (QC) and Artificial Intelligence (AI)

# Mujra: Urban Drainage Network Topology Optimizer

## Introduction
The مجرى is an urban drainage network topology optimizer that helps cities reduce the risk of flooding, overflows, and inefficiencies in aging drainage systems. It combines hybrid quantum-classical algorithms with AI to deliver real-time optimization and visualization of water flow.

![alt text](https://ars.els-cdn.com/content/image/1-s2.0-S0043135421010976-gr3_lrg.jpg)


## Demo
https://github.com/basil-ahmed/QMorjan-team17/assets/90772853/2f5a1e15-c5d4-490a-91b2-c51f10dfacda


## Background

Drainage networks are critical for urban resilience and public health, but are increasingly strained by climate change and urbanization. Mujra uses advanced algorithms to identify the most effective intervention points within the network and leverages quantum computing to optimize drainage flow and restoration strategies.


## Team

| Name  | Role | Level | Affiliation | Country | 
| ------------- | ------------- | ------------- | ------------- | ------------- |
| [Zyead Alwsh](U22106802@sharjah.ac.ae)	| Student	 | Senior |	University Of Sharjah	 | Syria, 	UAE |
| [Omar Kashour](omarkashour45@gmail.com)	| Student	| Senior | 	Birzeit University |	Palestine |
| [Rohan Timmaraju](rt2970@columbia.edu)	| Student	| Freshman | Columbia University |	Australia, USA |
| [Hala Awladmohammed](h.awladmohammed@student.aaup.edu)	|	Student	| Junior |	Arab American University | Jordan, Palestine |
| [Anas Ibrahim](a23ibrah@uwaterloo.ca)	|	Student	|	Masters	|	University of Waterloo | Egypt, Canada |
| [Dhruv Bhat](db4364@nyu.edu)	|	Student	 |	Bachelors	 |	Student Research Affiliate, Center for Quantum and Topological Systems at New York University Abu Dhabi	 |	India |
| [Mahdia Toubal](mahdia.toubal@gmail.com)	|	Student	| Masters	 |	The Higher National School of Computer Science |	Algeria |
| [Nahyan Alhosani](naa506@nyu.edu) | 	Student	 |	Junior | New York University Abu Dhabi |	UAE |
| [Shahram Chaudhry](sc9425@nyu.edu) | 	Student	Junior	0.0	New York University Abu Dhabi | Pakistan, UAE |
| [Alex Baudoin Nguetsa Tankeu](anguetsa@aimsric.org) |	Student, Mentor | Masters	| African Institute for Mathematical Sciences - Research & Innovation Center | Cameroon, Rwanda |
| [Sama Kanbour](samakanbour@gmail.com) | 	Mentor |	Senior	1.0	GE Aerospace  |	France, USA |
| [Mohammed Alghadeer](mohammed.alghadeer@physics.ox.ac.uk)	|	Mentor |	PhD	 | University of Oxford |	Saudi Arabia, United Kingdom |
| [Muhammad Kashif](muhammadkashif038@gmail.com) | Mentor | PhD | New York University Abu Dhabi | Pakistan, UAE |

## Presentation

[Presentation](https://docs.google.com/presentation/d/1QvU6STsqRpExncq30ouulwNxy55LFzJAiTKUcZwIlGQ/edit?slide=id.g120cbbff307_0_0#slide=id.g120cbbff307_0_0)

## Quantum Computing Model & Classical Maching Learning Model

The classical machine learning model uses unsupervised learning with Gaussian Mixture Models (GMM) for real-time detection of drainage networks from UAE digital elevation models. The Quantum model employs Quantum Annealing to solve the Set Cover Problem for determining optimal drainage repopulation points.

## Tech Stack

- QUBO/QAOA
- VQLS
- DQI
- Qiskit
- qBraid
- D-Wave Ocean SDK
- Python 3.8+
- scikit-learn
- numpy


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

The model requires an input graph representation of detected drainage from the Classical CV Model.

```bash
python bitmap_things.ipynb.py --graph_path /path/to/drainage_graph
```

## Output

The quantum algorithm generates a set of points representing the optimal locations for drainage network interventions. The model outputs a visual map highlighting critical sections of the drainage system, along with a CSV file containing the coordinates of the identified areas.


## Data Visualization

All generated images (model output) are present in this repository.


## Roadmap

- 0–6 Months: Validate the product with UAE MOCCAE and Dubai Drainage Project; refine based on pilot feedback.
- 6–18 Months: Expand across the Gulf region; enhance features with real-time analytics and risk alerts.
- 18 Months–3 Years: Scale to 15+ countries with localized data systems and introduce drainage health forecasting.
- 3–5 Years: Deploy full autonomous optimization and position as a global infrastructure resilience solution.


## Acknowledgments

A special thanks to the students, mentors and judges involved in the Mujra project, including those from NYUAD, Oxford, MIT, Google, GE and other institutions. We welcome contributions from the community.


## License

This project is licensed under the NYUAD License - see the `LICENSE` file for details.
