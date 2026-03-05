import json
import sys
import subprocess
import os


commands = []
os.makedirs("evaluation/outputs", exist_ok=True)
os.makedirs("evaluation/prompts", exist_ok=True)

with open("evaluation/evaluation.json", 'r') as f:
    tests = json.load(f)

for test in tests:
    video_name = test['src_video_name']
    # height = test['height']
    # width = test['width']
    fps = test['fps']
    prompt = test['prompt']
    output_name = test['output_video_name']

    with open(f"evaluation/prompts/{output_name}.txt", 'w') as f:
        f.write(prompt)

    for name, ckpt_folder, config_file, fixed_noise_scale in [
        # ("default", "wan_causal_dmd_v2v", "wan_causal_dmd_v2v.yaml", False),
        ("kv_cache_21", "wan_causal_dmd_v2v", "wan_causal_dmd_v2v_kv_cache_21.yaml", False),
        # ("sink_token_0", "wan_causal_dmd_v2v", "wan_causal_dmd_v2v_sink_tokens_0.yaml", False),
        # ("fixed_noise_scale", "wan_causal_dmd_v2v", "wan_causal_dmd_v2v.yaml", True),
        # ("causvid", "autoregressive_checkpoint", "wan_causal_dmd_v2v_causvid.yaml", True),
    ]:

        command = f'''\
            python streamv2v/inference.py \
            --config_path configs/{config_file} \
            --checkpoint_folder /media/cephfs/video/VideoUsers/thu2025/zhurui11/StreamDiffusionV2/ckpts/wan_causal_dmd_v2v/ \
            --output_folder evaluation/outputs/{name}/{output_name} \
            --prompt_file_path evaluation/prompts/{output_name}.txt \
            --video_path evaluation/videos/{video_name}.mp4 \
            --height 304 \
            --width 544 \
            --fps {fps} \
            --step 2\
        '''
        if fixed_noise_scale:
            command += " --fixed_noise_scale"
        commands.append(command)
        # print(command)

print("Start")
sys.stdout.flush()

# for cmd in commands:
#     # print(cmd)
#     try:
#         result = subprocess.run(cmd, shell=True, check=True, capture_output=True, text=True)
#         if result.stderr:
#             print("Command error output:", result.stderr)
#         if result.stdout:
#             print("Command output:")
#             print(result.stdout)
#         sys.stdout.flush()
#         import time
#         time.sleep(3) # Sleep for a few seconds to ensure all output is printed before the next command starts
#     except subprocess.CalledProcessError as e:
#         print("\n--- Command failed with error ---")
#         print(f"Error: {e}")
#         print(f"Return code: {e.returncode}")
#         print(f"Command run: {e.cmd}")

#         if e.stdout:
#             print("\n--- Captured stdout ---")
#             print(e.stdout)

#         if e.stderr:
#             print("\n--- Captured stderr ---")
#             print(e.stderr)
#         sys.stdout.flush()
#         break

for cmd in commands:
    try:
        # 关键：不用 capture_output，stdout/stderr 直接输出到终端
        p = subprocess.Popen(cmd, shell=True)
        ret = p.wait()
        if ret != 0:
            raise subprocess.CalledProcessError(ret, cmd)
        sys.stdout.flush()
        import time
        time.sleep(3)
    except subprocess.CalledProcessError as e:
        print("\n--- Command failed with error ---")
        print(f"Return code: {e.returncode}")
        print(f"Command run: {e.cmd}")
        sys.stdout.flush()
        break

print("Finished")
sys.stdout.flush()
