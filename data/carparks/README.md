# Obtaining (estimation) of Maximum Car Parking Capacities

This repository contains scripts and data for estimating the maximum parking capacities of LTA car parks based on historical availability data across multiple snapshots.

Run ``` main.py ``` to generate a historical availability graph. Ensure JSON files are named ``` carpark{id}.json ``` where ``` {id} ``` is the sequence in chronological order. The script will read these files and produce a graph showing the availability trends over time.

Run ``` main2.py ``` to estimate the maximum parking capacities based on the historical availability data. This script will analyze the availability trends and provide an estimation of the maximum capacity for each car park.