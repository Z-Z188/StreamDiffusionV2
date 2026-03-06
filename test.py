import cv2

cap = cv2.VideoCapture("bird.mp4")
fps = cap.get(cv2.CAP_PROP_FPS)
frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
duration = frame_count / fps

print("FPS:", fps)
print("Frame count:", frame_count)
print("Duration (s):", duration)
cap.release()
