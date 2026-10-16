import numpy as np
from PIL import Image
import csv

# 采样坐标定义
latitudes = list(range(89, -90, -2))   # 89, 87, 85, ..., -89
longitudes = list(range(-179, 180, 2)) # -179, -177, -175, ..., 179

# 初始化判断矩阵 (90行 × 180列)
land_matrix = np.zeros((90, 180), dtype=int)

def is_land(lat, lon):
    """
    根据手工编写的地理知识规则判断给定坐标是否为陆地。
    返回 1=陆地，0=水域
    """
    
    # 南极洲：南纬60度以南全部算陆地（冰盖覆盖）
    if lat <= -60:
        return 1
    
    # 格陵兰：约60°N-85°N, -75°W--10°W
    if 60 <= lat <= 85 and -75 <= lon <= -10:
        return 1
    
    # 冰岛：约63°N-67°N, -25°W--13°W
    if 63 <= lat <= 67 and -25 <= lon <= -13:
        return 1
    
    # 欧洲主体：约35°N-71°N, -10°W-40°E
    if 35 <= lat <= 71 and -10 <= lon <= 40:
        # 排除部分海域
        # 波罗的海部分
        if 54 <= lat <= 60 and 10 <= lon <= 30:
            if lat >= 56 and 18 <= lon <= 22:
                return 0  # 波罗的海中部
        # 地中海：排除大部分
        if lat <= 45 and lon >= 0:
            if lat <= 42 and 5 <= lon <= 35:
                # 保留意大利、希腊等半岛
                if not (37 <= lat <= 45 and 8 <= lon <= 20):  # 意大利半岛
                    if not (35 <= lat <= 42 and 19 <= lon <= 28):  # 希腊
                        return 0
        return 1
    
    # 亚洲主体：约0°N-75°N, 40°E-180°E
    if 0 <= lat <= 75 and 40 <= lon <= 180:
        # 排除部分内海和海湾
        # 黑海：约42°N-47°N, 27°E-42°E
        if 42 <= lat <= 47 and 27 <= lon <= 42:
            return 0
        # 里海：约36°N-47°N, 47°E-54°E
        if 36 <= lat <= 47 and 47 <= lon <= 54:
            return 0
        # 日本海部分
        if 35 <= lat <= 52 and 127 <= lon <= 142:
            if 37 <= lat <= 48 and 128 <= lon <= 140:
                return 0  # 日本海
        return 1
    
    # 日本列岛：约30°N-45°N, 130°E-145°E
    if 30 <= lat <= 45 and 130 <= lon <= 145:
        return 1
    
    # 中东/西亚：约15°N-45°N, 35°E-65°E
    if 15 <= lat <= 45 and 35 <= lon <= 65:
        # 排除波斯湾、红海
        if 24 <= lat <= 30 and 48 <= lon <= 56:
            return 0  # 波斯湾
        if 12 <= lat <= 30 and 36 <= lon <= 44:
            return 0  # 红海
        return 1
    
    # 南亚/印度次大陆：约5°N-35°N, 65°E-95°E
    if 5 <= lat <= 35 and 65 <= lon <= 95:
        # 孟加拉湾部分
        if 5 <= lat <= 22 and 80 <= lon <= 95:
            if lat <= 20 and lon >= 85:
                return 0
        return 1
    
    # 东南亚大陆：约5°N-25°N, 95°E-110°E
    if 5 <= lat <= 25 and 95 <= lon <= 110:
        return 1
    
    # 印度尼西亚群岛：约-10°S-10°N, 95°E-140°E
    if -10 <= lat <= 10 and 95 <= lon <= 140:
        # 大量岛屿，保留主要部分
        if -8 <= lat <= 6 and 95 <= lon <= 135:
            return 1
    
    # 菲律宾：约5°N-20°N, 120°E-127°E
    if 5 <= lat <= 20 and 120 <= lon <= 127:
        return 1
    
    # 非洲大陆：约-35°S-37°N, -18°W-52°E
    if -35 <= lat <= 37 and -18 <= lon <= 52:
        # 排除地中海南岸部分海域
        if lat >= 30 and lon <= 10:
            if lat >= 33 and -6 <= lon <= 10:
                return 0  # 地中海
        return 1
    
    # 马达加斯加：约-26°S--12°S, 43°E-51°E
    if -26 <= lat <= -12 and 43 <= lon <= 51:
        return 1
    
    # 北美洲主体：约25°N-75°N, -170°W--50°W
    if 25 <= lat <= 75 and -170 <= lon <= -50:
        # 排除五大湖区域（简化）
        if 42 <= lat <= 50 and -93 <= lon <= -76:
            if 43 <= lat <= 49 and -90 <= lon <= -79:
                return 0  # 五大湖简化
        # 哈德逊湾：约50°N-65°N, -95°W--75°W
        if 50 <= lat <= 65 and -95 <= lon <= -75:
            return 0
        return 1
    
    # 中美洲：约5°N-30°N, -120°W--75°W
    if 5 <= lat <= 30 and -120 <= lon <= -75:
        # 墨西哥湾部分
        if 18 <= lat <= 31 and -98 <= lon <= -80:
            if 19 <= lat <= 28 and -96 <= lon <= -82:
                return 0  # 墨西哥湾
        return 1
    
    # 加勒比群岛：古巴等
    if 18 <= lat <= 23 and -85 <= lon <= -74:
        return 1
    
    # 南美洲：约-56°S-13°N, -82°W--34°W
    if -56 <= lat <= 13 and -82 <= lon <= -34:
        return 1
    
    # 澳大利亚：约-44°S--10°S, 113°E-154°E
    if -44 <= lat <= -10 and 113 <= lon <= 154:
        return 1
    
    # 新西兰：约-47°S--34°S, 166°E-179°E
    if -47 <= lat <= -34 and 166 <= lon <= 179:
        return 1
    
    # 英国和爱尔兰：约50°N-61°N, -11°W-2°E
    if 50 <= lat <= 61 and -11 <= lon <= 2:
        return 1
    
    # 斯堪的纳维亚半岛：约55°N-71°N, 4°E-31°E
    if 55 <= lat <= 71 and 4 <= lon <= 31:
        return 1
    
    # 默认为水域
    return 0

# 填充矩阵
print("正在生成判断矩阵...")
for i, lat in enumerate(latitudes):
    for j, lon in enumerate(longitudes):
        land_matrix[i, j] = is_land(lat, lon)

# 验证矩阵
total_points = land_matrix.size
land_points = np.sum(land_matrix)
water_points = total_points - land_points
print(f"总采样点数：{total_points}")
print(f"陆地点数：{land_points}")
print(f"水域点数：{water_points}")
print(f"陆地占比：{land_points/total_points*100:.2f}%")

# 保存CSV矩阵
csv_path = "land_ocean_matrix.csv"
with open(csv_path, 'w', newline='') as f:
    writer = csv.writer(f)
    for row in land_matrix:
        writer.writerow(row)
print(f"已保存矩阵CSV：{csv_path}")

# 生成原始图片 (180×90)
# 白色=陆地(255)，黑色=水域(0)
img_array = (land_matrix * 255).astype(np.uint8)
img_original = Image.fromarray(img_array, mode='L')
original_path = "land_ocean_180x90.png"
img_original.save(original_path)
print(f"已保存原始图片：{original_path} (180×90)")

# 放大至1440×720，使用最近邻插值
img_scaled = img_original.resize((1440, 720), Image.NEAREST)
scaled_path = "land_ocean_1440x720.png"
img_scaled.save(scaled_path)
print(f"已保存放大图片：{scaled_path} (1440×720)")

print("\n实验完成！")
print("所有文件已生成：")
print(f"  - {csv_path}")
print(f"  - {original_path}")
print(f"  - {scaled_path}")
