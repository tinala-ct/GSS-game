# Impact Lab

เกมซ้อมมวยมุมมองบุคคลที่หนึ่ง เล่นบนคอมพิวเตอร์หรือหน้าจอสัมผัส เปิด `index.html` ในเบราว์เซอร์ได้ทันที ไฟล์ภาพ ฟอนต์ และโค้ดอยู่ในโปรเจกต์ทั้งหมด

## เล่นบนเครื่อง

1. เลือกกระสอบทราย หุ่นคู่ซ้อม หรือนักมวยสมมติ กด **ปรับเพศและอายุ** บนเป้าประเภทหุ่นหรือนักมวยเพื่อเลือกคู่ซ้อม
2. เลือกนวมหรือไม้โฟม กำหนดรอบ 1–3 นาที แล้วกด **เริ่มซ้อม**
3. กด **A / D** หรือแตะครึ่งซ้ายและครึ่งขวาของสนามเพื่อชกหรือเหวี่ยงไม้ เมื่อเลือกนวมกับนักมวยหรือหุ่น เกมจะเล็งใบหน้าเป็นค่าเริ่มต้น คุณเปลี่ยนจุดเล็งเป็นลำตัวก่อนเริ่มซ้อมได้ กดค้างเพื่อชาร์จจนเต็มใน 1 วินาที แล้วปล่อยเพื่อออกหมัด กด **Space** ค้างเพื่อตั้งการ์ด และกด **Esc** เพื่อพักหรือซ้อมต่อ
4. เมื่อหมดเวลาหรือเลือก **จบรอบนี้** เกมจะแสดงจำนวนครั้งที่เข้าเป้า คอมโบสูงสุด และเวลาที่ซ้อมจริง

หน้า **สถิติการซ้อม** แสดง 30 รอบล่าสุด และให้เลือกรูปโปรไฟล์ผู้เล่น รูปจะถูกย่อเป็นสี่เหลี่ยมจัตุรัสและเก็บร่วมกับสถิติในเบราว์เซอร์ของเครื่องนั้น ข้อมูลการเล่นบนเครื่องกับบน GitHub Pages จะอยู่คนละพื้นที่จัดเก็บ

นวมและไม้โฟมเคลื่อนเข้าหาผิวเป้า กระสอบยุบตามระดับที่แตะบนสนาม ก่อนแกว่งและคืนรูปตามแรงสปริง เสียงกระแทกและการนับคะแนนเริ่มในเฟรมที่ถึงเป้า นักมวยสมมติทั้ง 6 คนใช้ภาพตัวละครที่สร้างขึ้นประกอบกับการเอนตัวตามแรงกระทบ รอยช้ำบริเวณที่หมัดสัมผัสจะเข้มขึ้นเมื่อถูกซ้ำและเริ่มใหม่ทุกรอบ ส่วนหุ่นคู่ซ้อมใช้โมเดลสามมิติ

## เผยแพร่ผ่าน GitHub Pages

1. สร้าง repository ชื่อ `GSS-game` บน GitHub สำหรับบัญชี GitHub Free ใช้ repository แบบ **Public**
2. ใน GitHub Desktop เลือก **Clone a repository** แล้วเลือก repository นั้น คัดลอกไฟล์เกมจากโฟลเดอร์นี้ลงในโฟลเดอร์ที่ clone มา ให้ `index.html`, `style.css`, `game.js`, `ring.js`, `mannequin.js`, `.nojekyll` และโฟลเดอร์ `assets` อยู่ที่ระดับบนสุด
3. เลือก branch `main` กด **Commit to main** แล้ว **Push origin**
4. บนเว็บ GitHub เปิด **Settings → Pages → Build and deployment** เลือก **Deploy from a branch** ตั้ง branch เป็น **main** และโฟลเดอร์เป็น **/(root)** แล้วกด **Save**
5. ดูสถานะในแท็บ **Actions** เมื่อเผยแพร่สำเร็จ กด **Visit site** ที่หน้า **Settings → Pages** ลิงก์ปกติจะเป็น `https://ชื่อบัญชี.github.io/GSS-game/`
6. เมื่อต้องการอัปเดตเกม ให้ commit และ push ไฟล์ที่แก้ไปยัง branch เดิม GitHub Pages จะเผยแพร่เวอร์ชันใหม่

ถ้าพบ 404 ให้ตรวจว่ามีไฟล์ `index.html` อยู่ที่รากของ branch ที่เลือก และงาน Pages ในแท็บ Actions สำเร็จแล้ว ชื่อไฟล์ภาพและโฟลเดอร์ต้องตรงตามตัวพิมพ์เล็กใหญ่

[คู่มือกำหนดแหล่งเผยแพร่ของ GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

<details>
<summary>ที่มาของภาพประกอบ</summary>

ใช้ ImageGen ในตัวสร้างฉาก `assets/warehouse.webp` และภาพอุปกรณ์ที่แยกเป็น `assets/bag.webp`, `assets/glove.webp` และ `assets/baton.webp` ด้วยคำสั่งต่อไปนี้

```
Generate an environment plate for a photorealistic first-person boxing videogame. Wide 16:9 landscape photograph. The view is FROM INSIDE the ring of an atmospheric old industrial warehouse boxing gym, from standing eye height angled slightly down to show a large expanse of worn charcoal canvas mat. Rope-lined rear ring corner on the right, tightly stretched dark rust red, black and bone white padded ropes define the back edge and side perspective of the ring. Tall steel sash factory windows at upper left throw warm bands of daylight and shadows diagonally across the floor. Muted slate-grey brick walls, exposed steel roof beams, some metal industrial light fittings. Rich warm grey copper tones, cinematic photographic grain, naturally detailed, crisp real-world geometry. Ring floor fills lower half. The exact center is open space to composite a hanging punching bag. No people, NO punching bags, NO gloves, no text, no interface, no lettering, no graphics, no foreground ropes blocking the camera. High-end sports photography, brighter highlights on left, natural and tactile.
```

```
Create a landscape 3:2 photorealistic 3D sports videogame inventory asset sheet with TRUE TRANSPARENT BACKGROUND. THREE distinct objects, evenly spaced in three separate columns with transparent gaps between. No shadows on a floor. LEFT third: one worn cylindrical graphite BLACK heavy punching bag shown fully upright front facing with 3 short leather hanging straps and a triangular chain yoke rising from the top, flat heavy base, wrinkled leather details, two faded burnt-orange narrow racing stripes wrapping near the bottom, and a large vertical old ivory stencilled 'IMPACT' on its front. Entire bag visible. CENTER third: ONE bulky deep oxblood/RUST RED boxing glove worn on a short length of tan wrist pointing upward, oriented as in a first person boxing video game camera looking at the BACK of a person's raised LEFT fist; thumb slightly visible on RIGHT, back of red leather boxing glove faces camera. Larger rounded knuckle portion at top, black cuff with small white woven patch, short bare wrist emerges from bottom, highlighted left. NOT 2 gloves. RIGHT third: one slim long black foam padded training baton with a burnt orange grip and orange stripe on tip, aligned vertically. Keep all three isolated objects completely separated, fully in frame. Physical objects with photoreal leather, crisp seams and scuffs, cinematic warm rim light from upper left. No backdrop or caption or frame, absolutely no extra content.
```

ภาพนักมวยใน `assets/boxers/` สร้างด้วย ImageGen ในตัว

```
Photorealistic videogame character sprite sheet on a genuinely TRANSPARENT BACKGROUND, 3 columns x 2 rows, EXACT equal grid, each character isolated in own cell, broad transparent margins so none touch. Six original fictional adult sparring athletes in a warehouse boxing gym. Each portrait from just above head down to upper thighs, same scale and centered in each grid cell, facing camera. Each in matching deep charcoal sleeveless boxing singlet with orange piping, black shorts, red brown gloves held around sternum leaving upper arms and shoulders visible. Neutral attentive athletic expressions, appropriate clothing, nonviolent training roster portraits, no marks or injuries. Top row: a 27-year-old male with short black hair, a 47-year-old male with dark wavy hair with touch of grey, a fit 65-year-old male with silver hair. Bottom row: 27-year-old adult female with tied dark hair, 47-year-old female with bob tucked back, 65-year-old female with short silver hair. Distinct fictional faces with Thai/Southeast Asian appearances. Warm light from upper left, clean texture and soft rim light, camera level with face, subtle 3/4 boxing stance with shoulders prominently visible. Landscape 3:2. Each person's head is vertically aligned in each row, same centered stance. NO labels or text or grid lines or backgrounds, no shadows outside silhouette, six SEPARATE characters, no other items.
```

</details>
