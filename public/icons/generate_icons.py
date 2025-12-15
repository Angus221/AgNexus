"""
AG Nexus 图标生成器
使用 Pillow 库生成插件图标
"""

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("正在安装 Pillow 库...")
    import subprocess
    subprocess.check_call(['pip', 'install', 'Pillow', '-q'])
    from PIL import Image, ImageDraw, ImageFont

import os

def create_icon(size):
    """创建指定尺寸的图标"""
    # 创建渐变背景
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 绘制圆角矩形背景
    radius = int(size * 0.2)

    # 创建渐变色
    for y in range(size):
        for x in range(size):
            # 计算是否在圆角矩形内
            in_rect = True

            # 四个角的检测
            if x < radius and y < radius:  # 左上角
                if (x - radius) ** 2 + (y - radius) ** 2 > radius ** 2:
                    in_rect = False
            elif x > size - radius and y < radius:  # 右上角
                if (x - (size - radius)) ** 2 + (y - radius) ** 2 > radius ** 2:
                    in_rect = False
            elif x < radius and y > size - radius:  # 左下角
                if (x - radius) ** 2 + (y - (size - radius)) ** 2 > radius ** 2:
                    in_rect = False
            elif x > size - radius and y > size - radius:  # 右下角
                if (x - (size - radius)) ** 2 + (y - (size - radius)) ** 2 > radius ** 2:
                    in_rect = False

            if in_rect:
                # 渐变色: #0078D4 -> #00BCF2
                t = (x + y) / (2 * size)
                r = int(0 + t * 0)
                g = int(120 + t * (188 - 120))
                b = int(212 + t * (242 - 212))
                img.putpixel((x, y), (r, g, b, 255))

    # 绘制 "AG" 文字
    draw = ImageDraw.Draw(img)

    # 尝试使用系统字体
    font_size = int(size * 0.4)
    try:
        # Windows 字体路径
        font_paths = [
            "C:/Windows/Fonts/segoeui.ttf",
            "C:/Windows/Fonts/arial.ttf",
            "C:/Windows/Fonts/msyh.ttc"
        ]
        font = None
        for fp in font_paths:
            if os.path.exists(fp):
                font = ImageFont.truetype(fp, font_size)
                break
        if not font:
            font = ImageFont.load_default()
    except:
        font = ImageFont.load_default()

    text = "AG"

    # 获取文字边界框
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]

    x = (size - text_width) // 2
    y = (size - text_height) // 2 - bbox[1]

    draw.text((x, y), text, fill=(255, 255, 255, 255), font=font)

    return img

def main():
    sizes = [16, 48, 128]
    script_dir = os.path.dirname(os.path.abspath(__file__))

    for size in sizes:
        icon = create_icon(size)
        filename = os.path.join(script_dir, f"icon{size}.png")
        icon.save(filename, 'PNG')
        print(f"已生成: icon{size}.png")

    print("\n图标生成完成！")

if __name__ == "__main__":
    main()
