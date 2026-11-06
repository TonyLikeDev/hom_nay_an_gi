/* Dữ liệu dùng chung: khung giờ bữa ăn, 6 nền ẩm thực, 30 món ăn. */
const FOOD = {
  MEALS: {
    sang: { label: 'Sáng', greet: 'Chào buổi sáng!', sub: 'Đến giờ ăn sáng rồi. Để tụi mình chọn giúp bạn nhé.' },
    trua: { label: 'Trưa', greet: 'Chào buổi trưa!', sub: 'Đến giờ ăn trưa rồi. Để tụi mình chọn giúp bạn nhé.' },
    toi: { label: 'Tối', greet: 'Chào buổi tối!', sub: 'Đến giờ ăn tối rồi. Để tụi mình chọn giúp bạn nhé.' },
    khuya: { label: 'Khuya', greet: 'Khuya rồi nhỉ?', sub: 'Vẫn còn đói à? Để tụi mình chọn giúp bạn nhé.' },
  },

  CUISINES: {
    viet: { name: 'Việt Nam', cover: 'pho-bo', desc: 'Món quen cho mọi bữa trong ngày.' },
    nhat: { name: 'Nhật Bản', cover: 'ramen', desc: 'Sushi, ramen và cơm nắm.' },
    han: { name: 'Hàn Quốc', cover: 'bibimbap', desc: 'Tteokbokki, gà rán, kimbap.' },
    trung: { name: 'Trung Hoa', cover: 'dimsum', desc: 'Dimsum, mì hoành thánh, cơm chiên.' },
    thai: { name: 'Thái Lan', cover: 'pad-thai', desc: 'Chua cay, khác hẳn các nền còn lại.' },
    y: { name: 'Ý', cover: 'pizza-margherita', desc: 'Pizza, mì Ý, món Âu dễ ăn nhất.' },
  },

  /* photo: mã ảnh trên Unsplash, by: tác giả (hiện ở trang Giới thiệu), crop: điểm cắt ảnh nếu cần. */
  DISHES: [
    { id: 'pho-bo', name: 'Phở bò', cuisine: 'viet', meals: ['sang', 'trua', 'khuya'], desc: 'Nước dùng xương hầm trong, bánh phở mềm, thịt bò tái chín.', photo: 'photo-1766050586763-723571af4dde', by: 'le_y0u' },
    { id: 'banh-mi', name: 'Bánh mì', cuisine: 'viet', meals: ['sang', 'khuya'], desc: 'Ổ bánh mì giòn kẹp pate, chả lụa, rau thơm và đồ chua.', photo: 'photo-1600454309261-3dc9b7597637', by: 'minhanh258' },
    { id: 'bun-cha', name: 'Bún chả', cuisine: 'viet', meals: ['trua'], desc: 'Thịt nướng than hoa ăn cùng bún, rau sống và nước mắm chua ngọt.', photo: 'photo-1742893368398-128bded9c656', by: 'megatunger' },
    { id: 'com-tam', name: 'Cơm tấm', cuisine: 'viet', meals: ['sang', 'trua', 'toi'], desc: 'Sườn nướng, bì, chả trứng trên cơm tấm, rưới mỡ hành.', photo: 'photo-1597311280719-b6bb2ca37f62', by: 'emily8103' },
    { id: 'banh-xeo', name: 'Bánh xèo', cuisine: 'viet', meals: ['toi'], desc: 'Bánh giòn vàng nhân tôm thịt, cuốn rau sống chấm nước mắm.', photo: 'photo-1788927783922-8b1299701b45', by: 'chonky_films' },

    { id: 'sushi', name: 'Sushi', cuisine: 'nhat', meals: ['trua', 'toi'], desc: 'Cơm trộn giấm cuộn cá hồi, cá ngừ và rong biển.', photo: 'photo-1579584425555-c3ce17fd4351', by: 'derekduran' },
    { id: 'ramen', name: 'Ramen', cuisine: 'nhat', meals: ['toi', 'khuya'], desc: 'Mì sợi dai trong nước dùng đậm, thịt xá xíu và trứng lòng đào.', photo: 'photo-1779453873118-0321c47aa1fd', by: 'karthickgislen' },
    { id: 'com-ca-ri', name: 'Cơm cà ri Nhật', cuisine: 'nhat', meals: ['trua', 'toi'], desc: 'Cà ri sánh, ngọt nhẹ với khoai tây, cà rốt và thịt.', photo: 'photo-1679279727895-bd5c9fb9c1a0', by: 'cohesionsingapore' },
    { id: 'onigiri', name: 'Onigiri', cuisine: 'nhat', meals: ['sang', 'khuya'], desc: 'Cơm nắm tam giác bọc rong biển, nhân cá hồi hoặc mơ muối.', photo: 'photo-1757961047498-198b406685ed', by: 'madeline_sd' },
    { id: 'udon', name: 'Udon', cuisine: 'nhat', meals: ['trua', 'toi'], desc: 'Sợi mì to dày trong nước dùng dashi thanh, ăn kèm tempura.', photo: 'photo-1761984336917-615bc6f7d4fa', by: 'pafuxu' },

    { id: 'bibimbap', name: 'Bibimbap', cuisine: 'han', meals: ['trua'], desc: 'Cơm trộn rau củ, thịt bò, trứng ốp và tương ớt gochujang.', photo: 'photo-1718777791239-c473e9ce7376', by: 'switchinglanes' },
    { id: 'tteokbokki', name: 'Tteokbokki', cuisine: 'han', meals: ['toi', 'khuya'], desc: 'Bánh gạo dẻo sốt cay ngọt, thêm chả cá và trứng luộc.', photo: 'photo-1747228469541-f0e7f56e7ec7', by: 'sobalc' },
    { id: 'ga-ran', name: 'Gà rán Hàn Quốc', cuisine: 'han', meals: ['toi', 'khuya'], desc: 'Gà chiên giòn phủ sốt cay ngọt hoặc tỏi mật ong.', photo: 'photo-1766589221562-e16eeacca795', by: 'diegoarenasderodrigo' },
    { id: 'kimbap', name: 'Kimbap', cuisine: 'han', meals: ['sang', 'trua'], desc: 'Cơm cuộn rong biển với trứng, rau củ và xúc xích.', photo: 'photo-1608731002187-d3448d224d18', by: 'deviyahya' },
    { id: 'canh-kim-chi', name: 'Canh kim chi', cuisine: 'han', meals: ['trua', 'toi'], desc: 'Canh kim chi chua cay nấu với thịt heo và đậu phụ.', photo: 'photo-1760228865341-675704c22a5b', by: 'rawkkim' },

    { id: 'dimsum', name: 'Dimsum', cuisine: 'trung', meals: ['sang', 'trua'], desc: 'Há cảo, xíu mại hấp nhỏ xinh nhân tôm thịt, ăn kèm trà nóng.', photo: 'photo-1763994679303-fa1f6a7bf687', by: 'fenghua1975' },
    { id: 'mi-hoanh-thanh', name: 'Mì hoành thánh', cuisine: 'trung', meals: ['sang', 'khuya'], desc: 'Mì trứng và hoành thánh nhân tôm thịt trong nước dùng ngọt.', photo: 'photo-1746183055178-e4d5889140f0', by: 'runninghead' },
    { id: 'vit-quay', name: 'Vịt quay Bắc Kinh', cuisine: 'trung', meals: ['toi'], desc: 'Da vịt giòn bóng, cuốn bánh mỏng với hành lá và tương ngọt.', photo: 'photo-1765441012353-10fb4701a276', by: 'retter' },
    { id: 'mapo-tofu', name: 'Đậu phụ Tứ Xuyên', cuisine: 'trung', meals: ['toi'], desc: 'Mapo tofu: đậu phụ non sốt thịt băm cay tê đặc trưng Tứ Xuyên.', photo: 'photo-1788603930622-636954e00065', by: 'zoshuacolah' },
    { id: 'com-chien-duong-chau', name: 'Cơm chiên Dương Châu', cuisine: 'trung', meals: ['trua', 'toi', 'khuya'], desc: 'Cơm chiên tơi với trứng, lạp xưởng, tôm và đậu Hà Lan.', photo: 'photo-1603133872878-684f208fb84b', by: 'krizphoto' },

    { id: 'pad-thai', name: 'Pad Thai', cuisine: 'thai', meals: ['trua', 'toi'], desc: 'Bánh phở xào sốt me chua ngọt với tôm, trứng và đậu phộng.', photo: 'photo-1637806930600-37fa8892069d', by: 'johnaledja' },
    { id: 'tom-yum', name: 'Tom Yum', cuisine: 'thai', meals: ['toi'], desc: 'Canh chua cay thơm sả, riềng, lá chanh, nấu với tôm.', photo: 'photo-1761037994516-502ed10932b0', crop: '&crop=focalpoint&fp-x=.5&fp-y=.8&fp-z=1.4', by: 'moeupheap' },
    { id: 'ca-ri-xanh', name: 'Cà ri xanh', cuisine: 'thai', meals: ['trua', 'toi'], desc: 'Cà ri nước cốt dừa cay nhẹ với gà và cà tím.', photo: 'photo-1716959669858-11d415bdead6', by: 'le_y0u' },
    { id: 'pad-kra-pao', name: 'Gà xào húng quế', cuisine: 'thai', meals: ['trua', 'khuya'], desc: 'Pad kra pao: gà băm xào ớt và húng quế Thái, ăn cùng cơm và trứng ốp.', photo: 'photo-1696906594893-e9995c4d7082', by: 'jointstar' },
    { id: 'xoi-xoai', name: 'Xôi xoài', cuisine: 'thai', meals: ['sang', 'khuya'], desc: 'Xôi nếp dẻo rưới nước cốt dừa, ăn cùng xoài chín.', photo: 'photo-1705234384751-84081009588e', by: 'markuswinkler' },

    { id: 'pizza-margherita', name: 'Pizza Margherita', cuisine: 'y', meals: ['trua', 'toi', 'khuya'], desc: 'Đế mỏng nướng lò, sốt cà chua, phô mai mozzarella và húng quế.', photo: 'photo-1574071318508-1cdbab80d002', by: 'aurel__lens' },
    { id: 'mi-y-carbonara', name: 'Mì Ý Carbonara', cuisine: 'y', meals: ['trua', 'toi'], desc: 'Mì Ý sốt trứng, phô mai pecorino và thịt heo muối.', photo: 'photo-1588013273468-315fd88ea34c', by: 'fresh_studio' },
    { id: 'lasagna', name: 'Lasagna', cuisine: 'y', meals: ['toi'], desc: 'Các lớp mì lá xen sốt thịt bò bằm và sốt kem, nướng phô mai.', photo: 'photo-1709429790175-b02bb1b19207', by: 'emanuelekstrom' },
    { id: 'risotto-nam', name: 'Risotto nấm', cuisine: 'y', meals: ['toi'], desc: 'Gạo Ý nấu sánh với nấm và phô mai parmesan.', photo: 'photo-1633964913295-ceb43826e7c9', by: 'robwicks' },
    { id: 'bruschetta', name: 'Bruschetta', cuisine: 'y', meals: ['sang', 'trua'], desc: 'Bánh mì nướng giòn phủ cà chua, tỏi và dầu ô liu.', photo: 'photo-1786918517795-c3abeee741c2', by: 'culinarissimo' },
  ],
};
