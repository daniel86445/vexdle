"""Builds js/items.js from the VEX catalog data scraped on 2026-11-19.

Prices are VEX store prices (USD). For an N-pack, the single item's price is pack price / N.
Weights are VEX's listed weights (lb). Where VEX lists a pack weight, single = pack / N.
Images are hotlinked from vexrobotics.com (prefix V: / M:) or YouTube reveal thumbnails (Y:).
"""
import json, math, re, os

V = "https://www.vexrobotics.com/media/catalog/product/"
M = "https://www.vexrobotics.com/media/mageworx/optionfeatures/product/option/value/"

def img(s):
    if s is None: return None
    if s.startswith("V:"): return V + s[2:]
    if s.startswith("M:"): return M + s[2:]
    if s.startswith("Y:"): return "https://img.youtube.com/vi/" + s[2:] + "/hqdefault.jpg"
    return s

ITEMS = []
def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")

def add(name, cat, sub, price, weight, image, xp, *, sku=None, mat=None, size=None,
        season=None, tags=(), fx=None, pack=None, unit=None):
    ITEMS.append(dict(id=slug(name), name=name, cat=cat, sub=sub, price=price, weight=weight,
                      img=img(image), xp=xp, sku=sku, mat=mat, size=size, season=season,
                      tags=list(tags), fx=fx, pack=pack, unit=unit))

def part(single_name, pack_label, n, cat, sub, pack_price, weight_single, image, xp_single, **kw):
    """Adds the single item and (if n>1) the N-pack as its own item."""
    price1 = round(pack_price / n, 2) if pack_price is not None else None
    add(single_name, cat, sub, price1, weight_single, image, xp_single, **kw)
    if n > 1:
        pxp = max(xp_single + 1, round(xp_single * math.sqrt(n)))
        pw = round(weight_single * n, 3) if weight_single is not None else None
        kw2 = dict(kw); kw2["tags"] = list(kw.get("tags", ())) + ["pack"]
        add(f"{single_name} ({pack_label})", cat, sub, pack_price, pw, image, pxp,
            pack=n, unit=slug(single_name), **kw2)

# ---------------- STRUCTURE (aluminum worth more than steel) ----------------
S = "structure"
part("1x2x1x25 Aluminum C-Channel", "6-pack", 6, S, "c-channel", 36.99, 0.116, "V:2/7/276-2288_1_1.jpg", 6, sku="276-2288", mat="aluminum", size=12.5)
part("1x2x1x35 Aluminum C-Channel", "6-pack", 6, S, "c-channel", 44.69, 0.157, "V:2/7/276-2289.jpg", 7, sku="276-2289", mat="aluminum", size=17.5)
part("1x3x1x35 Aluminum C-Channel", "6-pack", 6, S, "c-channel", 44.69, 0.235, "V:2/7/276-4359.jpg", 7, sku="276-4359", mat="aluminum", size=17.5)
part("1x5x1x25 Aluminum C-Channel", "6-pack", 6, S, "c-channel", 48.99, 0.211, "V:2/7/276-2290.jpg", 8, sku="276-2290", mat="aluminum", size=12.5)
part("1x5x1x35 Aluminum C-Channel", "6-pack", 6, S, "c-channel", 55.99, 0.298, "V:2/7/276-2298.jpg", 9, sku="276-2298", mat="aluminum", size=17.5)
part("1x2x1x35 Steel C-Channel", "2-pack", 2, S, "c-channel", 11.19, 0.361, "V:2/7/276-2906_2.jpg", 3, sku="276-2906", mat="steel", size=17.5)
part("1x5x1x25 Steel C-Channel", "4-pack", 4, S, "c-channel", 22.49, 0.485, "V:2/7/275-1138_2.jpg", 3, sku="275-1138", mat="steel", size=12.5)
part("1x5x1x35 Steel C-Channel", "4-pack", 4, S, "c-channel", 24.49, 0.678, "V:2/7/275-1139_2.jpg", 4, sku="275-1139", mat="steel", size=17.5)
part("2x2x25 Steel Angle", "pack", 1, S, "angle", 18.99, 0.252, "V:2/7/275-1142.jpg", 2, sku="275-1142", mat="steel", size=12.5)
part("2x2x35 Steel Angle", "pack", 1, S, "angle", 22.49, 0.353, "V:2/7/275-1143.jpg", 3, sku="275-1143", mat="steel", size=17.5)
part("3x3x35 Steel Angle", "pack", 1, S, "angle", 24.49, 0.516, "V:2/7/275-1144.jpg", 3, sku="275-1144", mat="steel", size=17.5)
part("1x1x35 Aluminum L-Channel", "6-pack", 6, S, "angle", 29.79, 0.1, "V:2/7/276-6484_2.jpg", 6, sku="276-6484", mat="aluminum", size=17.5, tags=["l-channel"])
part("2x2x35 Aluminum Angle", "6-pack", 6, S, "angle", 44.69, 0.154, "V:2/7/276-2304.jpg", 6, sku="276-2304", mat="aluminum", size=17.5)
part("2x2x2x20 Aluminum U-Channel", "6-pack", 6, S, "u-channel", 44.69, 0.15, "V:2/7/276-7285_1.jpg", 8, sku="276-7285", mat="aluminum", size=10)
part("1x25 Steel Bar", "8-pack", 8, S, "bar", 15.99, 0.071, "V:2/7/275-1141-closeup.jpg", 1, sku="275-1141", mat="steel", size=12.5)
part("1x25 Aluminum Bar", "16-pack", 16, S, "bar", 36.99, 0.030, "V:f/i/file_22_14.jpeg", 3, mat="aluminum", size=12.5)
part("5x15 Steel Plate", "2-pack", 2, S, "plate", 6.29, 0.134, "V:2/7/275-2023_1.jpg", 2, sku="275-2023", mat="steel", size=7.5)
part("5x25 Steel Plate", "4-pack", 4, S, "plate", 18.99, 0.327, "V:2/7/275-1140_1.jpg", 2, sku="275-1140", mat="steel", size=12.5)
part("5x25 Aluminum Plate", "6-pack", 6, S, "plate", 31.49, 0.146, "V:f/i/file_22_14.jpeg", 5, mat="aluminum", size=12.5)
add("Aluminum Structure Kit", S, "kit", 99.49, None, "V:f/i/file_22_14.jpeg", 30, mat="aluminum", tags=["kit"])
add("V5 Clawbot Structure (Aluminum)", S, "kit", 60.99, 1.1, "V:2/7/276-6240_web_image_1.jpg", 25, sku="276-6240", mat="aluminum", tags=["kit", "clawbot"])
# gussets
part("45 Degree Gusset", "pack", 1, S, "gusset", 8.49, 0.010, "V:2/7/276-7759_2.jpg", 2, sku="276-7759", mat="steel", tags=["gusset"])
part("30 Degree Gusset", "pack", 1, S, "gusset", 8.49, 0.010, "V:2/7/276-7758_2.jpg", 2, sku="276-7758", mat="steel", tags=["gusset"])
part("60 Degree Gusset", "pack", 1, S, "gusset", 8.49, 0.010, "V:2/7/276-7760_2.jpg", 2, sku="276-7760", mat="steel", tags=["gusset"])
part("90 Degree Gusset", "pack", 1, S, "gusset", 8.49, 0.010, "V:2/7/276-7761_2.jpg", 2, sku="276-7761", mat="steel", tags=["gusset"])
part("C-Channel Coupler Gusset", "8-pack", 8, S, "gusset", 24.49, 0.018, "V:2/7/276-2575_1.jpg", 2, sku="276-2575", mat="aluminum", tags=["gusset"])
part("Angle Coupler Gusset", "8-pack", 8, S, "gusset", 24.49, 0.016, "V:2/7/276-2578_2.jpg", 2, sku="276-2578", mat="aluminum", tags=["gusset"])
part("Angle Corner Gusset", "4-pack", 4, S, "gusset", 24.49, 0.032, "V:2/7/276-2576_1.jpg", 3, sku="276-2576", mat="aluminum", tags=["gusset"])
add("Gusset Pack", S, "gusset", 9.29, None, "V:2/7/276-1110-gusset-pack.png", 4, sku="276-1110", mat="steel", tags=["gusset", "kit"])
part("Hinge", "2-pack", 2, S, "hinge", 12.29, 0.07, "V:2/7/275-1272.jpg", 2, sku="275-1272", mat="steel")
part("Worm Gearbox Bracket", "2-pack", 2, S, "bracket", 15.99, 0.15, "V:f/i/file_2_6_2_1.jpg", 3, sku="275-1187", mat="steel")
part("Bevel Gearbox Bracket", "2-pack", 2, S, "bracket", 12.29, 0.12, "V:f/i/file_5_1_2_1.jpg", 3, sku="275-1189", mat="steel")
part("Rack Gearbox Bracket v2", "2-pack", 2, S, "bracket", 12.29, 0.115, "V:2/7/276-5771_1.png", 3, sku="276-5771", mat="steel")

# ---------------- MOTION ----------------
MO = "motion"
W = "wheel"
part('2" Omni-Directional Wheel', "4-pack", 4, MO, W, 24.49, 0.2, "M:2/7/276-9044_2inomnidirectionalwheel_group_rev1.jpg", 6, sku="276-9044", size=2, tags=["omni"])
part('2.75" Omni-Directional Anti-Static Wheel', "2-pack", 2, MO, W, 24.49, 0.154, "M:2/7/276-8106-composite.jpg", 8, sku="276-8106", size=2.75, tags=["omni"])
part('3.25" Omni-Directional Anti-Static Wheel', "2-pack", 2, MO, W, 24.49, 0.132, "M:2/7/276-8026.png", 9, sku="276-8026", size=3.25, tags=["omni"])
part('4" Omni-Directional Anti-Static Wheel', "2-pack", 2, MO, W, 30.89, 0.232, "M:2/7/276-8107.png", 8, sku="276-8107", size=4, tags=["omni"])
part('2.75" Traction Wheel', "4-pack", 4, MO, W, 12.25, 0.110, "M:2/7/276-1496-hs.jpg", 5, sku="276-1496", size=2.75, tags=["traction"])
part('2.75" Anti-Static Traction Wheel', "2-pack", 2, MO, W, 9.99, 0.096, "M:2/7/276_8098__2_75_anti_static_wheel_left_render_08042022.jpg", 6, sku="276-8098", size=2.75, tags=["traction"])
part('3.25" Anti-Static Traction Wheel', "2-pack", 2, MO, W, 14.39, 0.128, "M:2/7/276_7771_3_25_anti_static_wheel_left_render_08032022.jpg", 7, sku="276-7771", size=3.25, tags=["traction"])
part('4" Anti-Static Traction Wheel', "2-pack", 2, MO, W, 16.49, 0.164, "M:2/7/276_8103_4_00_anti_static_wheel_left_render_08052022.jpg", 6, sku="276-8103", size=4, tags=["traction"])
part('2" Mecanum Wheel V2', "4-pack", 4, MO, W, 49.99, 0.28, "M:2/7/276-9041_mecanumwheel_2in_knoll_rev1.jpg", 9, sku="276-9041", size=2, tags=["mecanum"])
part('4" Mecanum Wheel', "4-pack", 4, MO, W, 68.99, 0.41, "M:2/7/276-1447-rev2.jpg", 10, sku="276-1447", size=4, tags=["mecanum"])
part("Compression Wheel (30A)", "4-pack", 4, MO, W, 19.99, 0.04, "V:2/7/276-8877_flexwheel_4pack_rev1.jpg", 4, sku="276-8877", size=2, tags=["flex"])
part("Compression Wheel (40A)", "4-pack", 4, MO, W, 19.99, 0.04, "V:2/7/276-8878_flexwheel_4pack_rev1.jpg", 4, sku="276-8878", size=2, tags=["flex"])
part("Compression Wheel (60A)", "4-pack", 4, MO, W, 19.99, 0.04, "V:2/7/276-8879_flexwheel_4pack_rev1.jpg", 4, sku="276-8879", size=2, tags=["flex"])
part("V5 Flywheel Weight", "2-pack", 2, MO, W, 22.49, 0.24, "V:2/7/276-8794_flywheel_side_vs01_07052022.jpg", 7, sku="276-8794", size=3.4, tags=["flywheel"])
part("Intake Roller", "8-pack", 8, MO, "intake", 15.99, 0.016, "V:2/7/276-2026-intake-roller_1.jpg", 3, sku="276-1499")
add("Tread Links", MO, "tread", None, 0.038, "https://forge.vexrobotics.com/storage/feb/de7/22-/thumbnail/medium/febde722-6200-4b7d-9d0e-ce3f6fe4ff3a.png", 4, sku="276-6558", tags=["chain"])
G = "gear"
part("12T Metal Gear", "12-pack", 12, MO, G, 12.25, 0.003, "V:2/7/276-7368.png", 2, sku="276-7368", mat="steel", size=0.5)
part("12T High Strength Metal Pinion", "12-pack", 12, MO, G, 24.29, 0.002, "V:c/o/composite-2_2.jpg", 3, sku="276-2251", mat="steel", size=0.5, tags=["hs"])
part("24T High Strength Gear", "8-pack", 8, MO, G, 18.99, 0.009, "V:2/7/276-7572.jpg", 3, sku="276-7572", size=1, tags=["hs"])
part("36T High Strength Gear", "8-pack", 8, MO, G, 18.99, 0.012, "V:2/1/217-7747.jpg", 4, sku="276-7747", size=1.5, tags=["hs"])
part("48T High Strength Gear", "8-pack", 8, MO, G, 18.99, 0.02, "V:2/7/276-7747.jpg", 4, sku="276-7573", size=2, tags=["hs"])
part("60T High Strength Gear", "8-pack", 8, MO, G, 18.99, 0.03, "V:2/7/276-7748.jpg", 5, sku="276-7748", size=2.5, tags=["hs"])
part("72T High Strength Gear", "6-pack", 6, MO, G, 18.99, 0.05, "V:2/7/276-7574.jpg", 5, sku="276-7574", size=3, tags=["hs"])
part("84T High Strength Gear", "4-pack", 4, MO, G, 18.99, 0.08, "V:2/7/276-7749-001.jpg", 6, sku="276-7749", size=3.5, tags=["hs"])
add("Gear Kit", MO, G, 15.99, None, "V:2/7/276-2169-composite_1.jpg", 8, sku="276-2169", tags=["kit"])
add("Advanced Gear Kit", MO, G, 24.39, None, "V:2/7/276-2184-composite_1.jpg", 10, sku="276-2184", tags=["kit"])
SP = "sprocket"
part("6T High Strength Sprocket", "8-pack", 8, MO, SP, 15.99, 0.01, "V:2/7/276-3876-composite.jpg", 2, sku="276-3876", tags=["hs"])
part("12T High Strength Sprocket", "4-pack", 4, MO, SP, 15.99, 0.015, "V:2/7/276-3877.jpg", 3, sku="276-3877", tags=["hs"])
part("18T High Strength Sprocket", "4-pack", 4, MO, SP, 15.99, 0.02, "V:2/7/276-3878-composite.jpg", 3, sku="276-3878", tags=["hs"])
part("24T High Strength Sprocket", "4-pack", 4, MO, SP, 15.99, 0.03, "V:2/7/276-3879_1.jpg", 4, sku="276-3879", tags=["hs"])
part("30T High Strength Sprocket", "4-pack", 4, MO, SP, 15.99, 0.04, "V:2/7/276-3880_1.jpg", 4, sku="276-3880", tags=["hs"])
part("8T Sprocket, 6P", "8-pack", 8, MO, SP, 22.25, 0.0225, "V:2/7/276-8030.jpg", 2, sku="276-8030", mat="steel")
part("16T Sprocket, 6P", "8-pack", 8, MO, SP, 27.49, 0.0125, "V:2/7/276-8328.jpg", 3, sku="276-8328")
part("24T Sprocket, 6P", "8-pack", 8, MO, SP, 27.49, 0.0225, "V:2/7/276-8329.jpg", 3, sku="276-8329")
part("32T Sprocket, 6P", "4-pack", 4, MO, SP, 27.49, 0.035, "V:2/7/276-8330.jpg", 4, sku="276-8330")
part("40T Sprocket, 6P", "4-pack", 4, MO, SP, 27.49, 0.05, "V:2/7/276-8331.jpg", 4, sku="276-8331")
add("High Strength Conveyor Chain", MO, "chain", 23.19, None, "V:2/7/276-7141-composite.jpg", 6, sku="276-7141", tags=["chain"])
add("Additional High Strength Chain", MO, "chain", 30.89, None, "V:2/7/276-2252-high-strength-chain_1.jpg", 6, sku="276-2252", tags=["chain"])
add("Chain Add-on Pack", MO, "chain", 22.25, 0.09, "V:2/2/228-4983_1.jpg", 4, sku="228-4983", tags=["chain"])
SH = "shaft"
part('2" High Strength Shaft', "4-pack", 4, MO, SH, 6.29, 0.03, "V:2/7/276-3440.jpg", 2, sku="276-3440", mat="steel", size=2, tags=["hs"])
part('3" High Strength Shaft', "4-pack", 4, MO, SH, 6.29, 0.05, "V:2/7/276-3522.jpg", 2, sku="276-3522", mat="steel", size=3, tags=["hs"])
part('4" High Strength Shaft', "4-pack", 4, MO, SH, 6.79, 0.07, "V:2/7/276-3523.jpg", 2, sku="276-3523", mat="steel", size=4, tags=["hs"])
part('24" High Strength Shaft', "2-pack", 2, MO, SH, 18.99, 0.42, "V:e/3/e33a0204.jpg", 6, mat="steel", size=24, tags=["hs"])
part('12" Drive Shaft', "4-pack", 4, MO, SH, 11.19, 0.0525, "V:2/7/276-1149_1.jpg", 2, sku="276-1149", mat="steel", size=12)
add("Shaft Add-On Kit", MO, SH, 12.99, 0.26, "V:2/2/228-3057.jpg", 3, sku="228-3057", tags=["kit"])
part("Shaft Coupler", "5-pack", 5, MO, SH, 6.29, 0.008, "V:2/7/276-1843-shaft-coupler.jpg", 1, sku="276-1843")
part("Universal Joint", "5-pack", 5, MO, SH, 16.49, 0.022, "V:2/7/276-2723-universal-joint-a.jpg", 3, sku="276-2723")
part("Drive Shaft Bar Lock", "8-pack", 8, MO, SH, 7.79, 0.009, "V:2/7/275-1065.jpg", 1, sku="275-1065")
B = "bearing"
part("Bearing Flat", "10-pack", 10, MO, B, 6.29, 0.005, "V:b/e/bearing-flat.jpg", 1, sku="276-1209")
part("Low Profile Bearing Flat", "10-pack", 10, MO, B, 6.29, 0.003, "V:2/7/276-8023.jpg", 1, sku="276-8023")
part("Shaft Collar Retainer with Bearing Flat", "10-pack", 10, MO, B, 6.29, 0.004, "V:2/7/276-8024.jpg", 1, sku="276-8024")
part("High Strength Shaft Bearing", "10-pack", 10, MO, B, 9.99, 0.004, "V:2/7/276-3521.jpg", 2, sku="276-3521", tags=["hs"])
part("High Strength Pillow Block", "10-pack", 10, MO, B, 9.99, 0.005, "V:2/7/276_8383_high_strength_pillow_block_10_pack_left_render_07252022.jpg", 2, sku="276-8383", tags=["hs"])
add("Pillow Block Bearing & Lock Bar Pack", MO, B, 9.99, 0.04, "V:b/e/bearing-block-a.jpg", 2, sku="276-2016", tags=["kit"])
C = "collar"
part("Star Drive Shaft Collar", "16-pack", 16, MO, C, 9.99, 0.009, "V:2/7/276-6103-1.jpg", 1, sku="276-6103", mat="steel")
part("Star Drive Clamping Shaft Collar", "10-pack", 10, MO, C, 6.29, 0.013, "V:e/3/e33a8268.jpg", 1, sku="276-6101")
part("Rubber Shaft Collar", "30-pack", 30, MO, C, 7.99, 0.001, "V:2/2/228_3510_rubber_shaft_collar_30_pack_left_render_07192022.jpg", 1, sku="228-3510")
part("High Strength Clamping Shaft Collar", "10-pack", 10, MO, C, 12.25, 0.017, "V:e/3/e33a8271.jpg", 2, sku="276-6102", tags=["hs"])
part("Low Profile High Strength Clamping Shaft Collar", "10-pack", 10, MO, C, 22.39, 0.01, "V:2/7/276-7590_3qtr.jpg", 2, sku="276-7590", tags=["hs"])
add("Linear Motion Kit v2", MO, "linear", 31.49, 0.34, "V:e/3/e33a8261.jpg", 8, sku="276-6465", tags=["kit"])
add("Turntable Bearing Kit V2", MO, "turntable", 24.29, 0.26, "V:2/7/276-5652-composite.jpg", 8, sku="276-5652", tags=["kit"])
add("Claw Kit v2", MO, "claw", 24.49, 0.56, "V:a/s/assembled.jpg", 9, sku="276-6010", tags=["kit", "clawbot"])
add("Winch and Pulley Kit", MO, "winch", 18.99, 0.25, "V:e/3/e33a8400.jpg", 5, sku="276-1546", tags=["kit"])

# ---------------- HARDWARE ----------------
H = "hardware"
standoffs = [("1/4", .25, "0250-pack-10_1", 10, 3.79, 0.01), ("1/2", .5, "0500-pack-10", 10, 3.79, 0.02), ("3/4", .75, "0750-pack-10", 10, 4.99, 0.03),
             ("1", 1, "1000-pack-10", 10, 4.99, 0.04), ("1.5", 1.5, "1500-pack-10", 10, 9.99, 0.06), ("2", 2, "2000-pack-10", 10, 9.99, 0.09),
             ("2.5", 2.5, "2500-pack-10", 4, 7.29, 0.04), ("3", 3, "3000-pack-10", 4, 8.79, 0.06), ("4", 4, "4000-pack-10", 4, 9.99, 0.09)]
for lbl, sz, im, n, pr, pw in standoffs:
    part(f'{lbl}" Standoff', f"{n}-pack", n, H, "standoff", pr, round(pw / n, 4), f"M:b/e/beam-{im}.jpg", 1, mat="aluminum", size=sz)
part('5" Standoff', "4-pack", 4, H, "standoff", 11.19, 0.0275, "M:b/e/beam-5000-pack-10.jpg", 1, mat="aluminum", size=5)
part('6" Standoff', "4-pack", 4, H, "standoff", 12.29, 0.03, "V:b/e/beam-pack_2.jpg", 2, mat="aluminum", size=6)
STAR = "M:2/0/2016-newscrew.jpg"; HEX = "M:8/-/8-32-screw-5_8.jpg"
for lbl, sz, n, pr in [("1/4", .25, 100, 6.49), ("3/8", .375, 100, 6.49), ("1/2", .5, 100, 6.49), ("5/8", .625, 100, 7.39), ("3/4", .75, 100, 7.39),
                       ("7/8", .875, 100, 8.79), ("1", 1, 100, 8.79), ("1.25", 1.25, 50, 6.49), ("1.5", 1.5, 50, 6.49), ("1.75", 1.75, 50, 7.39),
                       ("2", 2, 25, 6.49), ("2.25", 2.25, 25, 6.29), ("2.5", 2.5, 25, 6.29)]:
    part(f'#8-32 x {lbl}" Star Drive Screw', f"{n}-pack", n, H, "screw", pr, round(0.0012 + 0.0016 * sz, 4), STAR, 1, mat="steel", size=sz, tags=["star"])
for lbl, sz, n, pr in [("1/4", .25, 100, 9.29), ("1/2", .5, 100, 9.29), ("5/8", .625, 100, 12.25), ("7/8", .875, 100, 12.25), ("1", 1, 100, 12.25),
                       ("1.25", 1.25, 50, 9.29), ("1.75", 1.75, 50, 12.25), ("2", 2, 25, 9.29)]:
    part(f'#8-32 x {lbl}" Hex Screw', f"{n}-pack", n, H, "screw", pr, round(0.0012 + 0.0016 * sz, 4), HEX, 1, mat="steel", size=sz, tags=["hex"])
part('#8-32 x 1/4" Locking Star Drive Screw', "100-pack", 100, H, "screw", 12.25, 0.0016, STAR, 1, mat="steel", size=.25, tags=["star"])
part('#8-32 x 1/2" Locking Star Drive Screw', "100-pack", 100, H, "screw", 12.25, 0.002, STAR, 1, mat="steel", size=.5, tags=["star"])
part('1/2" Thumbscrew', "50-pack", 50, H, "screw", 12.29, 0.002, "M:2/7/275-1485-thumbscrew.jpg", 1, size=.5)
part("#8-32 Keps Nut", "100-pack", 100, H, "nut", 4.89, 0.0029, "V:n/u/nut-8-32-keps_1.jpg", 1, mat="steel", sku="275-1026")
part("#8-32 Nylock Nut", "100-pack", 100, H, "nut", 4.99, 0.0039, "V:n/u/nut-8-32-nylock_1.jpg", 1, mat="steel", sku="275-1027")
part("#8-32 Hex Nut", "100-pack", 100, H, "nut", 3.79, 0.0026, "V:n/u/nut-8-32-hex_1.jpg", 1, mat="steel", sku="275-1028")
part("#8-32 Low Profile Nut", "100-pack", 100, H, "nut", 5.89, 0.0028, "V:2/7/276-7767.jpg", 1, mat="steel", sku="276-7767")
part("Steel Washer", "200-pack", 200, H, "washer", 6.29, 0.00075, "V:2/7/275-1024-washer-steel.jpg", 1, mat="steel", sku="275-1024")
add('0.375" OD Nylon Spacer Variety Pack', H, "spacer", 6.29, 0.05, "V:2/7/276-6340.jpg", 2, sku="276-6340", tags=["kit"])
add('0.50" OD Nylon Spacer Variety Pack', H, "spacer", 6.29, 0.09, "V:2/7/275-1066_0.50in_od_nylonspacervarietypack_4group_rev_01.jpg", 2, sku="275-1066", tags=["kit"])
add("Click-On Spacers Variety Pack", H, "spacer", 6.29, 0.02, "V:2/7/276-8019_1.jpg", 2, sku="276-8019", tags=["kit"])
part('#8-32 x 0.5" Hex Drive Coupler', "25-pack", 25, H, "coupler", 3.79, 0.0004, "V:c/o/coupler-832-0500-25-stack_1.jpg", 1, mat="steel")
part('#8-32 x 1" Hex Drive Coupler', "25-pack", 25, H, "coupler", 6.29, 0.0004, "V:c/o/coupler-832-1000-25-stack_1.jpg", 1, mat="steel")
part("1-Post Hex Nut Retainer", "10-pack", 10, H, "retainer", 6.29, 0.02, "V:e/3/e33a0731-2_1.jpg", 1)
part("4-Post Hex Nut Retainer", "10-pack", 10, H, "retainer", 6.29, 0.02, "V:e/3/e33a0741-2_1.jpg", 1)
part("1-Post Standoff Retainer", "10-pack", 10, H, "retainer", 6.29, 0.002, "V:2/7/276-8020.jpg", 1)
part("4-Post Standoff Retainer", "10-pack", 10, H, "retainer", 6.29, 0.003, "V:2/7/276-8022.jpg", 1)
part("#8-32 Star Drive Set Screw", "32-pack", 32, H, "screw", 6.29, 0.0006, "V:2/7/276-6098.jpg", 1, mat="steel", size=.125)
part('11" Zip Tie', "100-pack", 100, H, "zip-tie", 8.79, 0.004, "V:2/7/276-1035-tie-wrap-11-stack.jpg", 1, size=11, tags=["zip"])
part("Synthetic Rubber Band #32", "20-pack", 20, H, "rubber-band", 3.49, 0.0015, "V:f/i/file_28_8_1.jpg", 1, tags=["band"])
part("Synthetic Rubber Band #64", "10-pack", 10, H, "rubber-band", 4.49, 0.003, "V:2/7/276-3990_1.jpg", 1, tags=["band"])
part("EPDM Elastic Band #32", "10-pack", 10, H, "rubber-band", 6.49, 0.003, "V:2/7/276-8076_edpmelasticband_front.jpg", 2, tags=["band"])
part("Silicone Rubber Band #64", "10-pack", 10, H, "rubber-band", 8.79, 0.006, "V:2/2/228-6634_siliconerubberband64_front_1.jpg", 2, tags=["band"])

# ---------------- ELECTRONICS ----------------
E = "electronics"
add("V5 Robot Brain", E, "brain", 384.99, 0.63, "V:2/7/276-4810_v5brain_rqc.jpg", 60, sku="276-4810")
add("V5 Controller", E, "controller", 137.39, 0.77, "V:2/7/276-4820_vex_v5controller_vex_catalog_render_rev_01.jpg", 40, sku="276-4820")
add("V5 Robot Battery Li-Ion 1100mAh", E, "battery", 76.99, 0.77, "V:2/7/276-4811_v5_robotbatteryli-ion1100mah_left_render_rev_01.jpg", 30, sku="276-4811")
add("V5 Robot Radio", E, "radio", 48.79, 0.06, "V:2/7/276-4831_v5_robotradiofsaupdate_left_render_rev_01.jpg", 15, sku="276-4831")
add("V5 Smart Motor (11W)", E, "motor", 49.99, 0.35, "V:2/7/276-4840_v5_smartmotor11w_right_render_rev_01.jpg", 22, sku="276-4840", tags=["motor"])
add("V5 Smart Motor (5.5W)", E, "motor", 33.49, 0.2, "V:2/7/276-4842_expmotor_rqc_rev1.jpg", 14, sku="276-4842", tags=["motor"])
add("Smart Motor 36:1 Cartridge (100 RPM)", E, "cartridge", 13.29, 0.11, "V:e/3/e33a8535_1.jpg", 6, tags=["cartridge"], fx="red")
add("Smart Motor 18:1 Cartridge (200 RPM)", E, "cartridge", 13.29, 0.11, "V:e/3/e33a8537_1.jpg", 7, tags=["cartridge"], fx="green")
add("Smart Motor 6:1 Cartridge (600 RPM)", E, "cartridge", 13.29, 0.11, "V:e/3/e33a8534_1.jpg", 9, tags=["cartridge"], fx="blue")
add("Smart Motor Cap Replacement", E, "motor-part", 10.99, 0.04, "V:e/3/e33a8277.jpg", 2)
add("Inertial Sensor", E, "sensor", 55.49, 0.1, "V:2/7/276-4855_vex_v5inertialsensor_left_render_rev_01.jpg", 18, sku="276-4855", tags=["sensor"])
add("Rotation Sensor", E, "sensor", 44.29, 0.05, "V:2/7/276-6050_vex_v5_rotationsensor_vexcatalog_render_rev_01.jpg", 15, sku="276-6050", tags=["sensor"])
add("Optical Sensor", E, "sensor", 49.99, 0.06, "V:2/7/276-7043_v5opticalsensor_lqc.jpg", 15, sku="276-7043", tags=["sensor"])
add("Distance Sensor", E, "sensor", 49.99, 0.3, "V:2/7/276-4852_v5distancesensor_lqc.jpg", 15, sku="276-4852", tags=["sensor"])
add("V5 GPS Sensor", E, "sensor", 209.99, 0.15, "V:2/7/276-7405_gpssensor_3qr_rev1.jpg", 35, sku="276-7405", tags=["sensor"])
add("AI Vision Sensor", E, "sensor", 95.49, 0.16, "V:2/7/276-8659_ai_visionsensor_lqc_1.jpg", 30, sku="276-8659", tags=["sensor"])
part("Potentiometer V2", "2-pack", 2, E, "sensor", 15.99, 0.025, "V:v/e/vex_v5_potentiometer_back_right_v01_05252021.jpg", 6, sku="276-7417", tags=["sensor", "3-wire"])
part("Bumper Switch v2", "2-pack", 2, E, "sensor", 15.99, 0.03, "V:2/7/276-4858_bumperswitchv2_lqc_rev1.jpg", 5, sku="276-4858", tags=["sensor", "3-wire"])
part("Line Tracker", "3-pack", 3, E, "sensor", 48.79, 0.034, "V:2/7/276-2154-000_objectsensor_3ql_rev1.jpg", 6, sku="276-2154", tags=["sensor", "3-wire"])
add("3-Wire Expander", E, "expander", 44.29, 0.06, "V:2/7/276-5299_3-wireexpander_lqc_rev1.jpg", 10, sku="276-5299", tags=["3-wire"])
add("Smart Cables (Short Assortment)", E, "cable", 6.49, 0.08, "V:e/3/e33a9434.jpg", 4, sku="276-4860", tags=["cable", "kit"])
add("Smart Cables (Long Assortment)", E, "cable", 12.89, 0.30, "V:e/3/e33a9430.jpg", 5, sku="276-4861", tags=["cable", "kit"])
add("Smart Cable Stock (8m)", E, "cable", 7.79, 0.33, "V:e/3/e33a9635.jpg", 3, sku="276-5774", tags=["cable"])
part("Smart Cable Connector", "50-pack", 50, E, "cable", 3.99, 0.0016, "V:e/3/e33a9658.jpg", 1, sku="276-5775", tags=["cable"])
add("Smart Cable Crimping Tool", E, "tool", 24.29, 0.85, "V:u/n/untitled-1_4.jpg", 8, sku="276-5773", tags=["tool"])
add("V5 Robot Battery Charger", E, "battery", 12.89, None, "V:2/7/276-4841_rev2_1.jpg", 6, tags=["battery"])
part("V5 Battery Clip", "4-pack", 4, E, "battery", 6.29, 0.0125, "V:v/5/v5-battery_1.jpg", 1, sku="276-6020")
add("V5 Power Cable Assortment", E, "cable", 36.99, 0.46, "V:u/n/untitled-2_1.jpg", 5, sku="276-4817", tags=["cable", "kit"])

# ---------------- PNEUMATICS ----------------
PN = "pneumatics"
PIMG = "V:v/e/vex_276-8750__v5_pneumatics_kit_box_front_v01_06192023.jpg"
add("V5 Pneumatics Kit", PN, "kit", 309.99, None, PIMG, 45, sku="276-8750", tags=["kit"])
add("Air Tank 200ml", PN, "tank", 32.49, 0.694, "V:v/e/vex-pneumatics.png", 12, sku="276-8749")
add("25mm Stroke Pneumatic Cylinder", PN, "cylinder", 23.99, 0.07, "V:v/e/vex-pneumatics.png", 8, sku="276-8642", size=25 / 25.4)
add("50mm Stroke Pneumatic Cylinder", PN, "cylinder", 26.49, 0.086, "V:v/e/vex-pneumatics.png", 9, sku="276-8644", size=50 / 25.4)
add("75mm Stroke Pneumatic Cylinder", PN, "cylinder", 29.19, 0.099, "V:v/e/vex-pneumatics.png", 10, sku="276-8646", size=75 / 25.4)
add("Double Acting Solenoid", PN, "solenoid", 47.79, None, "V:v/e/vex-pneumatics.png", 12, sku="276-8752")
add("Pneumatic Pressure Regulator", PN, "regulator", 52.99, None, "V:v/e/vex-pneumatics.png", 10, sku="276-8748")
add("Shut-off Valve Fitting", PN, "fitting", 11.89, None, "V:v/e/vex-pneumatics.png", 3, sku="276-8755")
add("V5 Pneumatic Tubing (3m)", PN, "tubing", 13.29, None, "V:v/e/vex-pneumatics.png", 3, sku="276-8083")
part("Pneumatics Straight Fitting", "10-pack", 10, PN, "fitting", 11.69, None, "V:v/e/vex-pneumatics.png", 1, sku="276-8636")
part("Pneumatics 90-Degree Elbow Fitting", "8-pack", 8, PN, "fitting", 13.29, None, "V:v/e/vex-pneumatics.png", 1, sku="276-8637")

# ---------------- TOOLS / MISC ----------------
T = "tools"
add("Tool Kit V2", T, "tool", 9.99, 0.11, "V:2/7/276-5010.jpg", 3, sku="276-5010", tags=["tool", "kit"])
add("Performance Tool Kit", T, "tool", 48.99, 0.89, "V:2/7/276-1645-all.jpg", 10, sku="276-1645", tags=["tool", "kit"])
part("Open End Wrench", "12-pack", 12, T, "tool", 36.99, 0.039, "V:w/r/wrench.jpg", 1, tags=["tool"])
part("T15 Star Drive Key", "8-pack", 8, T, "tool", 9.99, 0.0125, "V:s/t/stardrive-toolbig.jpg", 1, tags=["tool", "star"])
part("T8 Star Drive Key", "8-pack", 8, T, "tool", 9.99, 0.0075, "V:s/t/stardrive-toolbig_1.jpg", 1, tags=["tool", "star"])
part('3/32" Hex Key', "8-pack", 8, T, "tool", 6.49, 0.006, "V:2/7/275-1030.png", 1, tags=["tool", "hex"])
part("T8 Star Screwdriver", "5-pack", 5, T, "tool", 18.99, 0.052, "V:2/7/276-5236-full_1.jpg", 2, tags=["tool", "star"])
add("Step Drill Bit", T, "tool", 33.49, None, "V:2/7/276_8365_step_drill_number_side_1.jpg", 4, tags=["tool"])
add("VEX Safety Glasses", T, "safety", 9.99, 0.14, "V:2/7/276-2175-safety-glasses_1.jpg", 4, sku="276-2175")
add("Robotics Engineering Notebook", T, "notebook", 12.29, 0.97, "V:v/5/v5rcnotebook.png", 12, sku="276-3023", tags=["notebook"])
add("VEX V5 Competition License Plate Kit", T, "license", 6.29, 0.28, "V:2/7/276-3938-hr.jpg", 5, sku="276-3938")
add("On-Field Robot Expansion Sizing Tool", T, "inspection", 48.79, 3.2, "V:e/3/e33a9101.jpg", 10, sku="276-5942", tags=["inspection"])
add("PET Sheet Variety Pack", T, "plastic", 10.99, 0.06, "V:2/7/276-8340.jpg", 3, sku="276-8340")

# ---------------- KITS / BUNDLES ----------------
K = "kit"
add("VEX V5 Competition Starter Kit", K, "bundle", 1284.99, 18.0, "V:h/e/herobot-v5.jpg", 90, tags=["kit", "bundle"])
add("VEX V5 Competition Super Kit", K, "bundle", 2149.99, 37.8, "V:2/7/276-7040_2.jpg", 120, tags=["kit", "bundle"])
add("VEX V5 System Bundle", K, "bundle", 779.49, 8.0, "V:2/7/276-7000_v5_systembundle_knoll_rev1_1.jpg", 70, tags=["kit", "bundle", "clawbot"])
add("VEX V5 Classroom Starter Bundle", K, "bundle", 4999.99, 63.6, "V:2/7/276-7070_v5_classroomstarterbundle_front_rev1.jpg", 150, tags=["kit", "bundle"])
add("VEX V5 Classroom Super Bundle", K, "bundle", 9899.99, 204.0, "V:2/7/276-7060-classroom-super-bundle-1000_1.jpg", 250, tags=["kit", "bundle"])
add("Booster Kit", K, "bundle", 214.49, None, "V:2/7/276-2232_booster_rev2.jpg", 25, tags=["kit"])
add("Metal & Hardware Kit", K, "bundle", 99.49, None, "V:h/a/hardware-and-metal-kit.jpg", 18, tags=["kit"])
add("Smart Field Controller", K, "field-control", 164.49, 0.83, "V:2/7/276-7577_smartfieldcontroller_rqc_rev1.jpg", 20)
add("Championship Event Trophy Pack", K, "trophy", 195.69, 18.8, "V:2/7/276-7528_v5_championshipeventtrophypack_knoll_rev1.jpg", 70, tags=["trophy"])
add("Qualifying Event Trophy Pack", K, "trophy", 184.39, 8.7, "V:2/7/276-7462_v5_qualifyingeventtrophypack_knoll_rev1.jpg", 55, tags=["trophy"])

# ---------------- FIELD ----------------
F = "field"
PER = "V:2/7/276-8242_portablecompetitionfieldperimeter_rqc_rev1.jpg"
add("Portable Competition Field Perimeter", F, "perimeter", 895.99, 108.9, PER, 80, sku="276-8242", tags=["perimeter"])
add("White Field Wall", F, "wall", round(895.99 / 12, 2), 6.0, PER, 10, tags=["wall", "white"], fx="white")
add("Black Field Wall", F, "wall", round(895.99 / 12, 2), 6.0, PER, 10, tags=["wall", "black"], fx="black")
part("Anti-Static Field Tile", "4-pack", 4, F, "tile", 38.79, 1.1, "V:e/3/e33a8383---four-stack.jpg", 4, tags=["tile"])
add("Anti-Static Field Tiles (18-pack)", F, "tile", 137.39, 19.8, "V:e/3/e33a8390.jpg", 35, tags=["tile", "pack"], pack=18, unit="anti-static-field-tile")
add("Anti-Static Full Field Tile Kit (36-pack)", F, "tile", 279.49, 39.6, "V:e/3/e33a8378.jpg", 60, tags=["tile", "pack"], pack=36, unit="anti-static-field-tile")
add("Competition Tile Bag", F, "bag", 44.69, 2.8, "V:2/7/276-8217-tile-bag_open.jpg", 4)
add("Field Element Plates (4-pack)", F, "plates", 32.49, 12.8, "V:f/i/field-plates.png", 8, sku="276-9091")
add("Full Field Setup", F, "full", round(895.99 + 279.49 + 599.99, 2), round(108.9 + 39.6 + 59.9, 1), "V:g/a/gamekit_2_1.png", 300,
    tags=["full-field"], season="override")

# ---------------- GAMES: fields, manuals, elements ----------------
GAMES = [  # key, name, years, reveal video id
    ("bridge-battle", "Bridge Battle", "2007-08", "v4rIVlfAP1c"),
    ("elevation", "Elevation", "2008-09", "qRdakgC4xms"),
    ("clean-sweep", "Clean Sweep", "2009-10", "qmSvVfuw2Tg"),
    ("round-up", "Round Up", "2010-11", "F54n7yZQJ4U"),
    ("gateway", "Gateway", "2011-12", "taf44kEtyrU"),
    ("sack-attack", "Sack Attack", "2012-13", "N-ehrKSYfjk"),
    ("toss-up", "Toss Up", "2013-14", "3euUzfn0TwI"),
    ("skyrise", "Skyrise", "2014-15", "PJ-5H3JVtPs"),
    ("nothing-but-net", "Nothing But Net", "2015-16", "A8daR6qBw3M"),
    ("starstruck", "Starstruck", "2016-17", "0t2zstQ84Tw"),
    ("in-the-zone", "In the Zone", "2017-18", "1Yo_mlR1VJU"),
    ("turning-point", "Turning Point", "2018-19", "CDDGBcs0TFM"),
    ("tower-takeover", "Tower Takeover", "2019-20", "_JVQOiw_OUU"),
    ("change-up", "Change Up", "2020-21", "Hxs0q9UoMDQ"),
    ("tipping-point", "Tipping Point", "2021-22", "H8XcvADUXTE"),
    ("spin-up", "Spin Up", "2022-23", "wIZgvVDZc2Y"),
    ("over-under", "Over Under", "2023-24", "dvDqEI7qO34"),
    ("high-stakes", "High Stakes", "2024-25", "Sx6HJSpopeQ"),
    ("push-back", "Push Back", "2025-26", "ocmONiVun9M"),
    ("override", "Override", "2026-27", "68NxYIAzbkY"),
]
GAME_KIT_PRICE = {"spin-up": (598.98, 46.3), "high-stakes": (589.99, 60.0), "push-back": (599.99, 54.0), "override": (599.99, 59.9)}
for i, (key, name, years, vid) in enumerate(GAMES):
    era = "v5" if i >= 12 else "cortex"   # V5 system era from Tower Takeover (2019-20)
    p, w = GAME_KIT_PRICE.get(key, (None, None))
    fxp = 8 + i * 2 + (40 if key == "override" else 0)
    add(f"{name} Field", "field", "game-field", p, w, "Y:" + vid, fxp, season=key, tags=["game-field", era], unit=years)
    mxp = 4 + i + (20 if key == "override" else 0)
    add(f"{name} Game Manual", "manual", "manual", 0.0, 0.0, "Y:" + vid, mxp, season=key, tags=["manual", era], fx="manual", unit=years)
# the worst item in the game
add("Override Game Manual v0.1", "manual", "manual", 0.0, 0.0, "Y:68NxYIAzbkY", -50, season="override", tags=["manual", "v0.1", "v5"], fx="manual-bad", unit="2026-27")

EL = "element"
add("Change Up Ball", EL, "ball", 4.99, 0.50, "V:b/a/ball.jpg", 8, season="change-up", sku="276-6639", tags=["ball"])
add("Spin Up Game Element Kit", EL, "kit", 149.99, 9.5, "V:2/7/276-7501.jpg", 25, season="spin-up", sku="276-7501", tags=["kit"])
add("Spin Up Field Element Kit 1", EL, "kit", 299.00, 18.3, "V:v/r/vrc-game-object-presale-graphics-2022_1.png", 35, season="spin-up", tags=["kit"])
add("Spin Up Field Element Kit 2", EL, "kit", 149.99, 18.5, "V:v/r/vrc-game-object-presale-graphics-2022_1_1.png", 30, season="spin-up", tags=["kit"])
add("Over Under Triball", EL, "triball", 6.29, 0.24, "V:t/r/triball.png", 10, season="over-under", sku="276-8358", tags=["ball"])
add("High Stakes Ring", EL, "ring", 1.89, 0.25, "V:r/e/redrings-square.png", 8, season="high-stakes", sku="276-8872", tags=["ring"])
add("High Stakes Full Game & Field Element Kit", EL, "kit", 589.99, 60.0, "V:r/r/rr-0903.png", 50, season="high-stakes", sku="276-8868", tags=["kit", "game-kit"])
add("Push Back Block", EL, "block", 2.49, 0.09, "V:2/7/276-9147_vrcscoringelementkit_front_red_rev1.jpg", 8, season="push-back", sku="276-9147", tags=["block"])
add("Push Back Full Game & Field Element Kit", EL, "kit", 599.99, 54.0, "V:p/u/pushbacksquare_1.jpg", 50, season="push-back", sku="276-9142", tags=["kit", "game-kit"])
OVK = "V:s/o/socringelementkit_1.png"
add("Override Scoring Element Kit", EL, "kit", 7.49, 0.34, OVK, 14, season="override", sku="276-9255", tags=["kit", "pin", "cup"])
add("Override Cup", EL, "cup", 3.75, 0.2, OVK, 10, season="override", tags=["cup"])
add("Override Red/Blue Pin", EL, "pin", 3.74, 0.14, OVK, 12, season="override", tags=["pin", "red", "blue"])
add("Override Red/Yellow Pin", EL, "pin", 3.74, 0.14, OVK, 9, season="override", tags=["pin", "red", "yellow"])
add("Override Blue/Yellow Pin", EL, "pin", 3.74, 0.14, OVK, 9, season="override", tags=["pin", "blue", "yellow"])
add("Override Yellow/Yellow Pin", EL, "pin", 3.74, 0.14, OVK, 8, season="override", tags=["pin", "yellow"])
add("Override Full Game & Field Element Kit", EL, "kit", 599.99, 59.9, "V:g/a/gamekit_2_1.png", 55, season="override", sku="276-9250", tags=["kit", "game-kit"])

# ---------------- MEMES (real VEX photos with an effect on top) ----------------
MM = "meme"
add("Stripped Screw", MM, "meme", 0.06, 0.002, STAR, -5, tags=["screw"], fx="stripped")
add("Dead Battery", MM, "meme", 76.99, 0.77, "V:2/7/276-4811_v5_robotbatteryli-ion1100mah_left_render_rev_01.jpg", -10, tags=["battery"], fx="dead")
add("Battery at 12%", MM, "meme", 76.99, 0.77, "V:2/7/276-4811_v5_robotbatteryli-ion1100mah_left_render_rev_01.jpg", -4, tags=["battery"], fx="low")
add("Brain with a Cracked Screen", MM, "meme", 384.99, 0.63, "V:2/7/276-4810_v5brain_rqc.jpg", -15, tags=["brain"], fx="cracked")
add("Smart Port That Stopped Working", MM, "meme", 0, 0, "V:2/7/276-4810_v5brain_rqc.jpg", -8, tags=["brain"], fx="dead")
add("Overheated Motor", MM, "meme", 49.99, 0.35, "V:2/7/276-4840_v5_smartmotor11w_right_render_rev_01.jpg", -6, tags=["motor"], fx="hot")
add("Snapped Rubber Band", MM, "meme", 0.17, 0.0015, "V:f/i/file_28_8_1.jpg", -2, tags=["band"], fx="broken")
add("Zip Tie Holding the Whole Robot Together", MM, "meme", 0.09, 0.004, "V:2/7/276-1035-tie-wrap-11-stack.jpg", 12, tags=["zip"], fx="hero")
add("Bent Shaft", MM, "meme", 2.80, 0.05, "V:2/7/276-1149_1.jpg", -3, tags=["shaft"], fx="bent")
add("Lost Hex Key", MM, "meme", 0.81, 0.006, "V:2/7/275-1030.png", -2, tags=["tool"], fx="lost")
add("Unplugged Smart Cable", MM, "meme", 0.5, 0.01, "V:e/3/e33a9434.jpg", -4, tags=["cable"], fx="dead")
add("Auton That Only Drives Forward", MM, "meme", 0, 0, "V:2/7/276-4810_v5brain_rqc.jpg", 3, tags=["auton"], fx="hero")
add("Controller Disconnected Mid-Match", MM, "meme", 137.39, 0.77, "V:2/7/276-4820_vex_v5controller_vex_catalog_render_rev_01.jpg", -8, tags=["controller"], fx="dead")
add("Robot Over the Size Limit", MM, "meme", 48.79, 3.2, "V:e/3/e33a9101.jpg", -6, tags=["inspection"], fx="fail")
add("Engineering Notebook Written the Night Before", MM, "meme", 12.29, 0.97, "V:v/5/v5rcnotebook.png", -3, tags=["notebook"], fx="rush")
add("Bag of Mystery Screws", MM, "meme", 1.0, 0.3, STAR, 2, tags=["screw"], fx="mystery")

# empty slot (rolled 3x as often as any one item)
add("Empty", "empty", "empty", 0, 0, None, -3, tags=["empty"])

# ---- checks ----
ids = [i["id"] for i in ITEMS]
dupes = {x for x in ids if ids.count(x) > 1}
assert not dupes, dupes
for it in ITEMS:
    it["tags"] = sorted(set(it["tags"]))
    for k in list(it):
        if it[k] is None or it[k] == []:
            del it[k]

out = "// Generated by tools/build_items.py. Data from vexrobotics.com, Nov 2026.\n" \
      "window.VEX_ITEMS = " + json.dumps(ITEMS, indent=0, ensure_ascii=False) + ";\n" \
      "window.VEX_GAMES = " + json.dumps([dict(key=k, name=n, years=y) for k, n, y, _ in GAMES]) + ";\n"
os.makedirs(os.path.join(os.path.dirname(__file__), "..", "js"), exist_ok=True)
open(os.path.join(os.path.dirname(__file__), "..", "js", "items.js"), "w").write(out)
from collections import Counter
print(len(ITEMS), "items", dict(Counter(i["cat"] for i in ITEMS)))
