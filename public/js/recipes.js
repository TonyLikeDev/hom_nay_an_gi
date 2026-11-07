/* Frontend editorial adaptations, not copied recipe text. Times are estimates. */
const RECIPES = {
  'xoi-xoai': {
    servings: 3, prep: '15 phút', cook: '35 phút', soak: 'Ngâm nếp ít nhất 3 giờ hoặc qua đêm; chưa tính trong thời gian trên.',
    ingredients: [
      { name: 'Gạo nếp', amount: 150, unit: 'g' },
      { name: 'Nước cốt dừa', amount: 125, unit: 'ml' },
      { name: 'Đường', amount: 1.5, unit: 'thìa canh' },
      { name: 'Muối', amount: 1, unit: 'nhúm' },
      { name: 'Xoài chín', amount: [1, 2], unit: 'quả' },
      { name: 'Kem dừa', amount: [1, 2], unit: 'thìa canh' },
      { name: 'Mè rang', amount: 0.5, unit: 'thìa canh' },
    ],
    steps: [
      ['Ngâm nếp', 'Ngâm ít nhất 3 giờ, sau đó xả và để ráo.'],
      ['Hấp chín', 'Lót khăn sạch trong xửng. Hấp khoảng 30 phút, đảo giữa chừng; hạt phải mềm, không còn lõi cứng.'],
      ['Trộn cốt dừa', 'Hâm cốt dừa với đường và muối cho tan, không đun sôi. Trộn vào nếp nóng, để thấm.'],
      ['Dọn món', 'Gọt và cắt xoài. Xếp cạnh xôi, thêm kem dừa và mè.'],
    ],
    tip: 'Chọn xoài chín thơm, còn giữ được miếng khi cắt.',
    source: { label: 'Mary Cadogan · Good Food — Sticky mango rice', url: 'https://www.bbcgoodfood.com/recipes/sticky-rice-mango' },
  },
  bruschetta: {
    servings: 2, prep: '10 phút', cook: '5 phút',
    ingredients: [
      { name: 'Bánh mì không mỡ động vật', amount: 4, unit: 'lát' },
      { name: 'Cà chua chín', amount: 250, unit: 'g' },
      { name: 'Tỏi', amount: 1, unit: 'tép' },
      { name: 'Dầu ô liu', amount: 1, unit: 'thìa canh' },
      { name: 'Húng quế', text: 'Một ít' },
      { name: 'Muối và tiêu', text: 'Vừa đủ' },
    ],
    steps: [
      ['Chuẩn bị cà chua', 'Rửa, cắt nhỏ cà chua; chắt phần nước dư để bánh không nhanh mềm.'],
      ['Trộn phần phủ', 'Xé húng quế, trộn cùng cà chua và dầu ô liu. Nêm muối, tiêu.'],
      ['Nướng bánh', 'Áp chảo khô hoặc nướng hai mặt đến khi vàng giòn, khoảng 3–5 phút. Chà tỏi lên mặt bánh ấm.'],
      ['Thưởng thức', 'Cho cà chua lên bánh ngay trước khi ăn.'],
    ],
    tip: 'Giữ riêng bánh và cà chua nếu chưa dùng ngay.',
    source: { label: 'Jamie Oliver — Bruschetta with tomato and basil', url: 'https://www.jamieoliver.com/recipes/bread/bruschetta-with-tomato-and-basil/' },
  },
};

/* Additional Vietnamese editorial adaptations; not restaurant recipes or tested nutrition claims. */
Object.assign(RECIPES, {
  "pho-bo": {
    "servings": 4,
    "prep": "15 phút",
    "cook": "20 phút",
    "ingredients": [
      {
        "name": "Hành tây",
        "amount": 1,
        "unit": "củ"
      },
      {
        "name": "Gừng",
        "amount": 3.5,
        "unit": "cm"
      },
      {
        "name": "Quế",
        "amount": 1,
        "unit": "thanh"
      },
      {
        "name": "Hoa hồi",
        "amount": 1,
        "unit": "cánh"
      },
      {
        "name": "Tỏi",
        "amount": 2,
        "unit": "tép"
      },
      {
        "name": "Nước dùng bò ít muối",
        "amount": 1000,
        "unit": "ml"
      },
      {
        "name": "Nước",
        "amount": 250,
        "unit": "ml"
      },
      {
        "name": "Cà rốt thái sợi",
        "amount": 125,
        "unit": "ml"
      },
      {
        "name": "Ớt chuông đỏ",
        "amount": 1,
        "unit": "quả"
      },
      {
        "name": "Nước cốt chanh",
        "amount": 15,
        "unit": "ml"
      },
      {
        "name": "Xì dầu ít muối",
        "amount": 5,
        "unit": "ml"
      },
      {
        "name": "Bánh phở khô",
        "amount": 125,
        "unit": "g"
      },
      {
        "name": "Thịt bò thăn thái mỏng",
        "amount": 225,
        "unit": "g"
      },
      {
        "name": "Giá đỗ",
        "amount": 250,
        "unit": "ml"
      },
      {
        "name": "Rau thơm",
        "text": "Một ít"
      }
    ],
    "steps": [
      [
        "Làm thơm gia vị",
        "Áp chảo hành và gừng cho xém nhẹ; cho quế, hồi và tỏi vào."
      ],
      [
        "Nấu nước dùng",
        "Thêm nước dùng bò và nước, đun sôi rồi hạ lửa 10 phút. Lọc bỏ gia vị; thêm cà rốt, ớt chuông, chanh và xì dầu."
      ],
      [
        "Chuẩn bị bánh phở",
        "Luộc bánh phở theo hướng dẫn trên bao bì, để ráo và chia vào bát."
      ],
      [
        "Nấu chín thịt và dọn",
        "Cho bò thái mỏng vào nước dùng đang sôi và nấu chín. Chan lên bánh phở, thêm giá đã chần và rau thơm."
      ]
    ],
    "tip": "Phiên bản nhanh tham khảo Canada’s Food Guide, có rau củ và nước dùng sẵn; không phải phở bò hầm xương truyền thống. Thể tích rau đong rời, không nén.",
    "source": {
      "label": "Canada’s Food Guide · Pho (beef noodle soup)",
      "url": "https://www.canada.ca/en/health-canada/services/food-guide/eating-support/kitchen/recipes/pho-beef-noodle-soup.html"
    }
  },
  "pad-thai": {
    "servings": 2,
    "prep": "15 phút",
    "cook": "15 phút",
    "ingredients": [
      {
        "name": "Sợi gạo khô",
        "amount": 125,
        "unit": "g"
      },
      {
        "name": "Tôm đã nấu chín, bóc vỏ",
        "amount": 200,
        "unit": "g"
      },
      {
        "name": "Nước cốt chanh",
        "amount": 3,
        "unit": "thìa canh"
      },
      {
        "name": "Đường nâu",
        "amount": 2,
        "unit": "thìa cà phê"
      },
      {
        "name": "Nước mắm",
        "amount": 2,
        "unit": "thìa canh"
      },
      {
        "name": "Dầu ăn",
        "amount": 2,
        "unit": "thìa canh"
      },
      {
        "name": "Hành lá",
        "amount": 4,
        "unit": "cây"
      },
      {
        "name": "Giá đỗ",
        "amount": 140,
        "unit": "g"
      },
      {
        "name": "Lạc rang",
        "amount": 25,
        "unit": "g"
      },
      {
        "name": "Ớt bột",
        "amount": 0.5,
        "unit": "thìa cà phê"
      },
      {
        "name": "Rau mùi",
        "text": "Một ít"
      }
    ],
    "steps": [
      [
        "Chuẩn bị sợi",
        "Ngâm hoặc luộc sợi gạo theo bao bì; xả và để ráo."
      ],
      [
        "Pha sốt",
        "Khuấy chanh, đường, nước mắm và ớt cho tan."
      ],
      [
        "Xào",
        "Làm nóng dầu, đảo tôm chín và hành. Thêm sợi, sốt, giá và một nửa lạc; đảo đến khi nóng đều, giá chín."
      ],
      [
        "Hoàn thiện",
        "Chia đĩa, thêm lạc còn lại và rau mùi đã rửa."
      ]
    ],
    "tip": "Bản đơn giản dùng tôm đã chín; có hải sản, nước mắm và lạc. Không tự xem là phiên bản chay.",
    "source": {
      "label": "Mary Cadogan · Good Food — Easy pad Thai",
      "url": "https://www.bbcgoodfood.com/recipes/easy-pad-thai"
    }
  },
  "pizza-margherita": {
    "servings": 4,
    "prep": "25 phút",
    "cook": "10–15 phút",
    "ingredients": [
      {
        "name": "Bột mì làm bánh mì",
        "amount": 300,
        "unit": "g"
      },
      {
        "name": "Men nở tức thì",
        "amount": 1,
        "unit": "thìa cà phê"
      },
      {
        "name": "Muối",
        "amount": 1,
        "unit": "thìa cà phê"
      },
      {
        "name": "Nước ấm",
        "amount": 200,
        "unit": "ml"
      },
      {
        "name": "Dầu ô liu",
        "amount": 1,
        "unit": "thìa canh"
      },
      {
        "name": "Cà chua nghiền passata",
        "amount": 100,
        "unit": "ml"
      },
      {
        "name": "Tỏi",
        "amount": 1,
        "unit": "tép"
      },
      {
        "name": "Mozzarella",
        "amount": 125,
        "unit": "g"
      },
      {
        "name": "Parmesan hoặc phô mai thay thế",
        "text": "Một ít"
      },
      {
        "name": "Cà chua bi",
        "text": "Một ít"
      },
      {
        "name": "Húng quế",
        "text": "Một ít"
      }
    ],
    "steps": [
      [
        "Nhào bột",
        "Trộn bột, men, muối với nước ấm và dầu. Nhào khoảng 5 phút cho mịn."
      ],
      [
        "Pha sốt",
        "Trộn passata với tỏi băm và húng quế."
      ],
      [
        "Tạo đế",
        "Chia bột thành hai phần, cán mỏng khoảng 25 cm; đặt trên khay phù hợp lò nướng."
      ],
      [
        "Nướng",
        "Làm nóng lò 240°C hoặc 220°C có quạt. Phủ sốt, phô mai và cà chua; nướng 8–15 phút đến khi đế chín giòn."
      ]
    ],
    "tip": "Khẩu phần gốc làm 2 pizza cho 4 người; thời gian tùy lò và độ dày đế. Muốn dùng chay cần kiểm tra men đông của phô mai.",
    "source": {
      "label": "Good Food · Pizza Margherita in 4 easy steps",
      "url": "https://www.bbcgoodfood.com/recipes/pizza-margherita-4-easy-steps"
    }
  },
  "onigiri": {
    "servings": 2,
    "prep": "15 phút",
    "cook": "25 phút",
    "ingredients": [
      {
        "name": "Gạo Nhật hạt ngắn",
        "amount": 180,
        "unit": "g"
      },
      {
        "name": "Nước nấu cơm",
        "amount": 240,
        "unit": "ml"
      },
      {
        "name": "Cá ngừ hộp đã ráo nước",
        "amount": 60,
        "unit": "g"
      },
      {
        "name": "Mayonnaise",
        "amount": 1,
        "unit": "thìa canh"
      },
      {
        "name": "Rong biển nori",
        "amount": 2,
        "unit": "lá"
      },
      {
        "name": "Muối",
        "text": "Một ít"
      }
    ],
    "steps": [
      [
        "Nấu cơm",
        "Vo gạo; thêm nước theo hướng dẫn loại gạo và nấu chín. Xới, để cơm bớt nóng."
      ],
      [
        "Làm nhân",
        "Trộn cá ngừ đã ráo với mayonnaise."
      ],
      [
        "Nắm cơm",
        "Rửa tay, dùng màng bọc thực phẩm sạch; chia cơm thành 4 phần, đặt nhân giữa rồi nắm kín thành tam giác."
      ],
      [
        "Cuốn nori",
        "Cắt nori vừa miếng, bọc cơm ngay trước khi ăn để giữ giòn."
      ]
    ],
    "tip": "Bản biên soạn nhân cá ngừ mayo, khoảng 4 nắm cho 2 người. Ăn sớm hoặc làm nguội nhanh và bảo quản lạnh; không để cơm/nhân lâu ở nhiệt độ phòng.",
    "source": {
      "label": "Nami · Just One Cookbook — Onigiri",
      "url": "https://www.justonecookbook.com/onigiri-rice-balls/"
    }
  },
  "canh-kim-chi": {
    "servings": 3,
    "prep": "10 phút",
    "cook": "25 phút",
    "ingredients": [
      {
        "name": "Kim chi",
        "amount": 450,
        "unit": "g"
      },
      {
        "name": "Nước kim chi",
        "amount": 60,
        "unit": "ml"
      },
      {
        "name": "Thịt vai heo thái mỏng",
        "amount": 225,
        "unit": "g"
      },
      {
        "name": "Đậu phụ",
        "amount": 150,
        "unit": "g"
      },
      {
        "name": "Hành tây",
        "amount": 1,
        "unit": "củ"
      },
      {
        "name": "Hành lá",
        "amount": 3,
        "unit": "cây"
      },
      {
        "name": "Đường",
        "amount": 2,
        "unit": "thìa cà phê"
      },
      {
        "name": "Gochugaru",
        "amount": 2,
        "unit": "thìa cà phê"
      },
      {
        "name": "Gochujang",
        "amount": 1,
        "unit": "thìa canh"
      },
      {
        "name": "Dầu mè",
        "amount": 1,
        "unit": "thìa cà phê"
      },
      {
        "name": "Nước dùng cá cơm hoặc gà",
        "amount": 480,
        "unit": "ml"
      },
      {
        "name": "Muối",
        "text": "Nêm sau cùng"
      }
    ],
    "steps": [
      [
        "Sơ chế",
        "Cắt kim chi, đậu phụ và hành. Dùng riêng dao thớt cho thịt sống."
      ],
      [
        "Nấu canh",
        "Cho kim chi, nước kim chi, thịt, hành và gia vị vào nồi; thêm nước dùng. Đun sôi rồi nấu lửa vừa 10 phút."
      ],
      [
        "Thêm đậu phụ",
        "Đảo nhẹ, xếp đậu lên; nấu tiếp 10–15 phút đến khi thịt chín hoàn toàn."
      ],
      [
        "Nếm và dọn",
        "Nếm rồi mới thêm muối vì kim chi và tương đã mặn. Rắc hành lá, dùng nóng."
      ]
    ],
    "tip": "Phiên bản có thịt heo và nước dùng động vật; kim chi cũng có thể chứa hải sản. Độ cay tùy loại tương/ớt.",
    "source": {
      "label": "Maangchi · Kimchi-jjigae",
      "url": "https://www.maangchi.com/recipe/kimchi-jjigae"
    }
  },
  "risotto-nam": {
    "servings": 3,
    "prep": "10 phút",
    "cook": "30 phút",
    "ingredients": [
      {
        "name": "Dầu hạt cải",
        "amount": 2,
        "unit": "thìa cà phê"
      },
      {
        "name": "Hành tây",
        "amount": 2,
        "unit": "củ"
      },
      {
        "name": "Ớt đỏ",
        "amount": 0.5,
        "unit": "quả"
      },
      {
        "name": "Nước dùng rau ít muối",
        "amount": 900,
        "unit": "ml"
      },
      {
        "name": "Tỏi",
        "amount": 2,
        "unit": "tép"
      },
      {
        "name": "Nấm",
        "amount": 250,
        "unit": "g"
      },
      {
        "name": "Gạo risotto",
        "amount": 150,
        "unit": "g"
      },
      {
        "name": "Húng quế băm",
        "amount": 2,
        "unit": "thìa canh"
      },
      {
        "name": "Sữa chua Hy Lạp 0% béo",
        "amount": 1,
        "unit": "thìa canh"
      },
      {
        "name": "Parmesan hoặc phô mai tương đương",
        "amount": 15,
        "unit": "g"
      },
      {
        "name": "Tiêu",
        "text": "Một ít"
      }
    ],
    "steps": [
      [
        "Xào nền",
        "Hâm nước dùng trong nồi riêng. Xào hành và ớt với dầu khoảng 5 phút."
      ],
      [
        "Thêm gạo",
        "Cho tỏi, nấm và tiêu vào, đảo; thêm gạo rồi đảo thêm 2 phút."
      ],
      [
        "Châm nước dùng",
        "Mỗi lần cho ít nước dùng nóng vừa ngập gạo, khuấy nhẹ. Khi gần cạn lại thêm, khoảng 17–20 phút đến khi hạt chín còn độ cắn."
      ],
      [
        "Hoàn thiện",
        "Trộn húng quế và sữa chua, đảo đều. Đậy nghỉ 2 phút, rắc phô mai trước khi dùng."
      ]
    ],
    "tip": "Tham khảo đúng phiên bản Diabetes UK. Không chuyển số liệu dinh dưỡng của nguồn sang phần ăn đã thay nguyên liệu hoặc khẩu phần; phô mai cần kiểm tra thành phần nếu dùng chay.",
    "source": {
      "label": "Diabetes UK · Mushroom risotto",
      "url": "https://www.diabetes.org.uk/living-with-diabetes/recipes/mushroom-risotto"
    }
  }
});

/* More source-attributed home versions; quantities and wording adapted. */
Object.assign(RECIPES, {
  "bun-cha": {
    "servings": 2,
    "prep": "20 phút",
    "cook": "15 phút",
    "ingredients": [
      {
        "name": "Thịt heo xay",
        "amount": 300,
        "unit": "g"
      },
      {
        "name": "Bún khô",
        "amount": 100,
        "unit": "g"
      },
      {
        "name": "Nước mắm ướp thịt",
        "amount": 1,
        "unit": "thìa canh"
      },
      {
        "name": "Đường ướp thịt",
        "amount": 2,
        "unit": "thìa cà phê"
      },
      {
        "name": "Tỏi ướp thịt",
        "amount": 1,
        "unit": "tép"
      },
      {
        "name": "Hành lá băm",
        "amount": 30,
        "unit": "g"
      },
      {
        "name": "Dầu áp chảo",
        "amount": 1.5,
        "unit": "thìa canh"
      },
      {
        "name": "Nước mắm pha chấm",
        "amount": 3,
        "unit": "thìa canh"
      },
      {
        "name": "Đường pha chấm",
        "amount": 3,
        "unit": "thìa canh"
      },
      {
        "name": "Giấm gạo",
        "amount": 2,
        "unit": "thìa canh"
      },
      {
        "name": "Nước cốt chanh",
        "amount": 2,
        "unit": "thìa canh"
      },
      {
        "name": "Nước pha chấm",
        "amount": 80,
        "unit": "ml"
      },
      {
        "name": "Tỏi pha chấm",
        "amount": 3,
        "unit": "tép"
      },
      {
        "name": "Tiêu, ớt",
        "text": "Tùy khẩu vị"
      },
      {
        "name": "Rau xà lách, rau thơm, giá chần",
        "text": "Vừa ăn"
      }
    ],
    "steps": [
      [
        "Ướp thịt",
        "Trộn thịt, nước mắm ướp, đường ướp, tỏi, hành và tiêu; giữ lạnh khi chờ."
      ],
      [
        "Pha chấm",
        "Khuấy tan đường pha chấm với nước, nước mắm pha chấm, giấm, chanh, tỏi và ớt. Để ngấm 10 phút."
      ],
      [
        "Áp chảo chả",
        "Chia thành 6 viên dẹt, áp chảo có dầu đến khi vàng hai mặt và thịt chín hoàn toàn bên trong."
      ],
      [
        "Dọn bún",
        "Nấu bún theo bao bì. Dọn cùng chả nóng, rau đã rửa và nước chấm."
      ]
    ],
    "tip": "Bản chả viên áp chảo, không phải bản nướng than kèm thịt miếng. Hai nhóm gia vị được tách để dễ đong; không nhất thiết dùng hết nước chấm.",
    "source": {
      "label": "Nagi · RecipeTin Eats — Bun Cha",
      "url": "https://www.recipetineats.com/bun-cha-vietnamese-meatballs/"
    }
  },
  "banh-xeo": {
    "servings": 4,
    "prep": "30 phút",
    "cook": "45–60 phút",
    "ingredients": [
      {
        "name": "Bột gạo",
        "amount": 170,
        "unit": "g"
      },
      {
        "name": "Bột mì đa dụng",
        "amount": 55,
        "unit": "g"
      },
      {
        "name": "Bột nghệ",
        "amount": 1.5,
        "unit": "thìa cà phê"
      },
      {
        "name": "Nước pha bột",
        "amount": 550,
        "unit": "ml"
      },
      {
        "name": "Nước cốt dừa",
        "amount": 260,
        "unit": "ml"
      },
      {
        "name": "Muối",
        "amount": 0.5,
        "unit": "thìa cà phê"
      },
      {
        "name": "Hành lá",
        "amount": 1,
        "unit": "cây"
      },
      {
        "name": "Thịt ba chỉ",
        "amount": 450,
        "unit": "g"
      },
      {
        "name": "Tôm bóc vỏ, bỏ chỉ",
        "amount": 300,
        "unit": "g"
      },
      {
        "name": "Hành tây",
        "amount": 1,
        "unit": "củ"
      },
      {
        "name": "Giá đỗ",
        "amount": 450,
        "unit": "g"
      },
      {
        "name": "Đậu xanh cà vỏ",
        "amount": 60,
        "unit": "g"
      },
      {
        "name": "Dầu đổ bánh",
        "text": "Vừa đủ"
      },
      {
        "name": "Rau cải, xà lách, rau thơm",
        "text": "Vừa ăn"
      },
      {
        "name": "Nước chấm đã pha",
        "text": "Vừa ăn"
      }
    ],
    "steps": [
      [
        "Pha bột",
        "Khuấy bột gạo, bột mì, nghệ, muối, nước và cốt dừa; nghỉ trong ngăn mát. Thêm hành lá khi đổ bánh."
      ],
      [
        "Chuẩn bị nhân",
        "Ngâm rồi hấp đậu đến mềm. Luộc thịt chín, thái mỏng; làm sạch tôm và rau."
      ],
      [
        "Tráng bánh",
        "Làm nóng chảo với ít dầu, đảo hành, thịt và tôm. Khi tôm gần chín, rót lớp bột mỏng và nghiêng đều chảo."
      ],
      [
        "Làm giòn",
        "Thêm đậu, giá; đậy khoảng 3 phút, rồi mở nắp nấu lửa vừa nhỏ đến khi bột chín, tôm chín và rìa giòn. Gập bánh và ăn ngay."
      ]
    ],
    "tip": "Bản biên soạn tôm thịt có đậu xanh. Dùng nước chấm đã pha theo khẩu vị. Lượng bánh tùy cỡ chảo; thời gian tăng khi đổ nhiều mẻ.",
    "source": {
      "label": "Huy Vu · Hungry Huy — Bánh Xèo",
      "url": "https://www.hungryhuy.com/banh-xeo-savory-vietnamese-crepes/"
    },
    "soak": "Nghỉ bột ít nhất 3 giờ trong ngăn mát; ngâm đậu theo hướng dẫn bao bì, chưa tính vào thời gian chuẩn bị."
  },
  "bibimbap": {
    "servings": 4,
    "prep": "25 phút",
    "cook": "25 phút",
    "ingredients": [
      {
        "name": "Cơm chín",
        "amount": 800,
        "unit": "g"
      },
      {
        "name": "Thịt bò thái sợi",
        "amount": 225,
        "unit": "g"
      },
      {
        "name": "Trứng",
        "amount": 4,
        "unit": "quả"
      },
      {
        "name": "Rau chân vịt",
        "amount": 225,
        "unit": "g"
      },
      {
        "name": "Giá đậu tương",
        "amount": 300,
        "unit": "g"
      },
      {
        "name": "Cà rốt",
        "amount": 1,
        "unit": "củ"
      },
      {
        "name": "Bí ngòi",
        "amount": 1,
        "unit": "quả"
      },
      {
        "name": "Nước tương ướp bò",
        "amount": 1,
        "unit": "thìa canh"
      },
      {
        "name": "Mật ong ướp bò",
        "amount": 1,
        "unit": "thìa canh"
      },
      {
        "name": "Tỏi băm",
        "amount": 1,
        "unit": "thìa canh"
      },
      {
        "name": "Dầu mè",
        "amount": 2,
        "unit": "thìa canh"
      },
      {
        "name": "Gochujang",
        "amount": 2,
        "unit": "thìa canh"
      },
      {
        "name": "Dầu ăn, muối, mè rang",
        "text": "Vừa đủ"
      }
    ],
    "steps": [
      [
        "Chuẩn bị",
        "Ướp bò với nước tương, mật ong, nửa tỏi và một ít dầu mè; để lạnh. Thái rau."
      ],
      [
        "Nấu rau",
        "Luộc giá đậu tương cho chín kỹ. Chần rau chân vịt, vắt ráo; xào riêng cà rốt và bí. Nêm nhẹ rau với phần tỏi còn lại, muối và dầu mè."
      ],
      [
        "Làm chín thịt, trứng",
        "Xào bò đến chín; chiên trứng cho lòng trắng và lòng đỏ đông theo nhu cầu an toàn."
      ],
      [
        "Xếp bát",
        "Cho cơm nóng, rau, bò, trứng vào bát; thêm gochujang từng ít và mè, trộn trước khi ăn."
      ]
    ],
    "tip": "Bản rau phổ biến, lược bỏ gosari và doraji của nguồn; dầu mè chia cho ướp thịt và nêm rau. Có trứng và bò, không gán nhãn chay.",
    "source": {
      "label": "Maangchi · Bibimbap",
      "url": "https://www.maangchi.com/recipe/bibimbap"
    }
  },
  "kimbap": {
    "servings": 3,
    "prep": "25 phút",
    "cook": "20 phút",
    "ingredients": [
      {
        "name": "Cơm chín hạt ngắn",
        "amount": 650,
        "unit": "g"
      },
      {
        "name": "Rong biển nori",
        "amount": 5,
        "unit": "lá"
      },
      {
        "name": "Xúc xích đã chín",
        "amount": 200,
        "unit": "g"
      },
      {
        "name": "Trứng",
        "amount": 3,
        "unit": "quả"
      },
      {
        "name": "Rau chân vịt",
        "amount": 250,
        "unit": "g"
      },
      {
        "name": "Cà rốt",
        "amount": 1,
        "unit": "củ"
      },
      {
        "name": "Củ cải vàng muối",
        "amount": 5,
        "unit": "thanh"
      },
      {
        "name": "Dầu mè",
        "amount": 2,
        "unit": "thìa canh"
      },
      {
        "name": "Muối, dầu ăn",
        "text": "Vừa đủ"
      }
    ],
    "steps": [
      [
        "Chuẩn bị cơm",
        "Trộn cơm ấm với một ít muối và nửa dầu mè; để bớt bốc hơi."
      ],
      [
        "Làm nhân",
        "Chần rau, vắt ráo; xào cà rốt. Tráng trứng chín, cắt sợi. Làm nóng xúc xích theo bao bì và cắt dài."
      ],
      [
        "Cuộn",
        "Trải nori trên mành, dàn lớp cơm mỏng chừa mép. Xếp nhân dọc giữa rồi cuộn chặt vừa tay."
      ],
      [
        "Cắt và dùng",
        "Quét phần dầu mè còn lại, cắt bằng dao sạch hơi ẩm. Dùng sớm hoặc bảo quản lạnh nếu chưa ăn."
      ]
    ],
    "tip": "Bản thay thịt bò bằng xúc xích theo gợi ý nguồn; khoảng 5 cuộn cho 3 người. Không phải sushi giấm; không để cơm và trứng lâu ở nhiệt độ phòng.",
    "source": {
      "label": "Maangchi · Classic gimbap — biến thể xúc xích",
      "url": "https://www.maangchi.com/recipe/gimbap"
    }
  },
  "mapo-tofu": {
    "servings": 3,
    "prep": "15 phút",
    "cook": "20 phút",
    "ingredients": [
      {
        "name": "Đậu phụ non",
        "amount": 450,
        "unit": "g"
      },
      {
        "name": "Thịt heo xay",
        "amount": 150,
        "unit": "g"
      },
      {
        "name": "Doubanjiang cay",
        "amount": 1,
        "unit": "thìa canh"
      },
      {
        "name": "Tỏi băm",
        "amount": 1,
        "unit": "thìa canh"
      },
      {
        "name": "Gừng băm",
        "amount": 1,
        "unit": "thìa canh"
      },
      {
        "name": "Hoa tiêu Tứ Xuyên xay",
        "amount": 0.5,
        "unit": "thìa cà phê"
      },
      {
        "name": "Dầu ớt",
        "amount": 1,
        "unit": "thìa canh"
      },
      {
        "name": "Dầu ăn",
        "amount": 1,
        "unit": "thìa canh"
      },
      {
        "name": "Nước dùng gà ít muối",
        "amount": 160,
        "unit": "ml"
      },
      {
        "name": "Bột bắp",
        "amount": 1.5,
        "unit": "thìa cà phê"
      },
      {
        "name": "Nước hòa bột",
        "amount": 60,
        "unit": "ml"
      },
      {
        "name": "Hành lá",
        "amount": 1,
        "unit": "cây"
      }
    ],
    "steps": [
      [
        "Sơ chế",
        "Cắt đậu thành khối; khuấy bột bắp với nước nguội. Chuẩn bị riêng gừng và tỏi."
      ],
      [
        "Xào thịt",
        "Phi gừng, tỏi với dầu, thêm thịt và đảo tơi đến chín. Cho doubanjiang và hoa tiêu vào, đảo nhanh."
      ],
      [
        "Nấu sốt",
        "Thêm nước dùng, đun sôi nhẹ. Khuấy lại nước bột bắp rồi rót từ từ đến khi sốt sánh."
      ],
      [
        "Om đậu",
        "Thêm đậu và dầu ớt, đảo nhẹ; om 3–5 phút cho nóng đều, rắc hành."
      ]
    ],
    "tip": "Bản giảm dầu và độ cay; không phải bản nguyên định lượng của nguồn. Có thịt heo và nước dùng gà; đậu phụ không khiến món này thành món chay.",
    "source": {
      "label": "Kaitlin · The Woks of Life — Mapo Tofu",
      "url": "https://thewoksoflife.com/ma-po-tofu-real-deal/"
    }
  },
  "tom-yum": {
    "servings": 2,
    "prep": "15 phút",
    "cook": "20 phút",
    "ingredients": [
      {
        "name": "Tôm nguyên đầu và vỏ",
        "amount": 300,
        "unit": "g"
      },
      {
        "name": "Nước",
        "amount": 750,
        "unit": "ml"
      },
      {
        "name": "Nước dùng gà ít muối",
        "amount": 125,
        "unit": "ml"
      },
      {
        "name": "Sả",
        "amount": 2,
        "unit": "cây"
      },
      {
        "name": "Riềng",
        "amount": 1.5,
        "unit": "cm"
      },
      {
        "name": "Lá chanh Thái",
        "amount": 5,
        "unit": "lá"
      },
      {
        "name": "Ớt",
        "amount": 2,
        "unit": "quả"
      },
      {
        "name": "Tỏi",
        "amount": 3,
        "unit": "tép"
      },
      {
        "name": "Nấm bào ngư",
        "amount": 120,
        "unit": "g"
      },
      {
        "name": "Cà chua",
        "amount": 1,
        "unit": "quả"
      },
      {
        "name": "Hành tây",
        "amount": 0.5,
        "unit": "củ"
      },
      {
        "name": "Đường",
        "amount": 1,
        "unit": "thìa cà phê"
      },
      {
        "name": "Nước mắm",
        "amount": 3,
        "unit": "thìa canh"
      },
      {
        "name": "Nước cốt chanh",
        "amount": 3,
        "unit": "thìa canh"
      },
      {
        "name": "Rau mùi",
        "text": "Một ít"
      }
    ],
    "steps": [
      [
        "Sơ chế",
        "Bóc tôm, bỏ chỉ, để riêng thịt với đầu/vỏ. Đập sả, tỏi, ớt; thái riềng, vò lá chanh."
      ],
      [
        "Nấu nền",
        "Đun đầu/vỏ cùng nước, nước dùng và gia vị thơm 10 phút. Lọc bỏ toàn bộ xác."
      ],
      [
        "Nấu canh",
        "Cho hành, nấm và cà chua vào nước dùng; nấu khoảng 4 phút, thêm thịt tôm và nấu đến chín đục."
      ],
      [
        "Nêm cuối",
        "Thêm nước mắm, đường vừa miệng. Tắt bếp, cho chanh và rau mùi, dùng nóng."
      ]
    ],
    "tip": "Tom Yum tôm nước trong, không thêm sữa hay cốt dừa. Đong nước mắm theo nguyên liệu nhưng nêm dần; bỏ các miếng gia vị cứng trước khi ăn.",
    "source": {
      "label": "Nagi · RecipeTin Eats — Tom Yum Soup",
      "url": "https://www.recipetineats.com/tom-yum-soup-thai/"
    }
  }
});
