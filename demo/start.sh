#!/bin/bash
cd frontend
npm install
npm run build
if [ $? -eq 0 ]; then
    echo -e "\033[1;32m\nfrontend build success \033[0m"
else
    echo -e "\033[1;31m\nfrontend build failed\n\033[0m" >&2  exit 1
fi
cd ../


# python -m debugpy --listen 5678 --wait-for-client main.py --port 7860 --host 0.0.0.0 --num_gpus 1 --step 1
python main.py --port 7860 --host 0.0.0.0 --num_gpus 1 --step 1


# python main.py --port 7860 --host 0.0.0.0 --num_gpus 1 --step 2
# python main.py --port 7860 --host 0.0.0.0 --num_gpus 1 --step 4

# Note: --step sets how many denoising steps are used during inference.
