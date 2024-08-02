def convert_color(color_int):
    if color_int < 0:
        color_int += 2 ** 32
    # Convert to hexadecimal and zero-fill to ensure it's 8 characters long
    hex_color = f"{color_int:08X}"

    # Extract ARGB components
    alpha = int(hex_color[0:2], 16)
    red = int(hex_color[2:4], 16)
    green = int(hex_color[4:6], 16)
    blue = int(hex_color[6:8], 16)

    return [alpha, red, green, blue]
