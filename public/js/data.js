/* Generated from data/food.json. */
const FOOD = {
  "MEALS": {
    "sang": {
      "label": "Sáng",
      "time": "05:00 - 10:59",
      "greet": "Chào buổi sáng!",
      "sub": "Đến giờ ăn sáng rồi. Để tụi mình chọn giúp bạn nhé."
    },
    "trua": {
      "label": "Trưa",
      "time": "11:00 - 12:59",
      "greet": "Chào buổi trưa!",
      "sub": "Đến giờ ăn trưa rồi. Để tụi mình chọn giúp bạn nhé."
    },
    "chieu": {
      "label": "Chiều",
      "time": "13:00 - 17:59",
      "greet": "Chào buổi chiều!",
      "sub": "Đến giờ ăn chiều rồi. Để tụi mình chọn giúp bạn nhé."
    },
    "toi": {
      "label": "Tối",
      "time": "18:00 - 21:59",
      "greet": "Chào buổi tối!",
      "sub": "Đến giờ ăn tối rồi. Để tụi mình chọn giúp bạn nhé."
    },
    "khuya": {
      "label": "Khuya",
      "time": "22:00 - 04:59",
      "greet": "Khuya rồi nhỉ?",
      "sub": "Vẫn còn đói à ? Để tụi mình chọn giúp bạn nhé."
    }
  },
  "CUISINES": {
    "viet": {
      "name": "Việt Nam",
      "cover": "pho-bo",
      "desc": "Món quen cho mọi bữa trong ngày."
    },
    "nhat": {
      "name": "Nhật Bản",
      "cover": "ramen",
      "desc": "Sushi, ramen và cơm nắm."
    },
    "han": {
      "name": "Hàn Quốc",
      "cover": "bibimbap",
      "desc": "Tteokbokki, gà rán, kimbap."
    },
    "trung": {
      "name": "Trung Hoa",
      "cover": "dimsum",
      "desc": "Dimsum, mì hoành thánh, cơm chiên."
    },
    "thai": {
      "name": "Thái Lan",
      "cover": "pad-thai",
      "desc": "Chua cay, khác hẳn các nền còn lại."
    },
    "y": {
      "name": "Ý",
      "cover": "pizza-margherita",
      "desc": "Pizza, mì Ý, món Âu dễ ăn nhất."
    },
    "quoc-te": {
      "name": "Quốc tế",
      "cover": "burger",
      "desc": "Bánh, đồ uống và món ăn từ nhiều nền ẩm thực.",
      "icon": "globe"
    }
  },
  "DISHES": [
    {
      "id": "pho-bo",
      "name": "Phở bò",
      "cuisine": "viet",
      "meals": [
        "sang",
        "trua",
        "khuya"
      ],
      "desc": "Nước dùng xương hầm trong, bánh phở mềm, thịt bò tái chín.",
      "photo": "photo-1766050586763-723571af4dde",
      "by": "le_y0u",
      "linkedRestaurantCount": 1
    },
    {
      "id": "banh-mi",
      "name": "Bánh mì",
      "cuisine": "viet",
      "meals": [
        "sang",
        "khuya",
        "chieu"
      ],
      "desc": "Ổ bánh mì giòn kẹp pate, chả lụa, rau thơm và đồ chua.",
      "photo": "photo-1600454309261-3dc9b7597637",
      "by": "minhanh258",
      "linkedRestaurantCount": 4
    },
    {
      "id": "bun-cha",
      "name": "Bún chả",
      "cuisine": "viet",
      "meals": [
        "trua"
      ],
      "desc": "Thịt nướng than hoa ăn cùng bún, rau sống và nước mắm chua ngọt.",
      "photo": "photo-1742893368398-128bded9c656",
      "by": "megatunger",
      "linkedRestaurantCount": 0
    },
    {
      "id": "com-tam",
      "name": "Cơm tấm",
      "cuisine": "viet",
      "meals": [
        "sang",
        "trua",
        "toi"
      ],
      "desc": "Sườn nướng, bì, chả trứng trên cơm tấm, rưới mỡ hành.",
      "photo": "photo-1597311280719-b6bb2ca37f62",
      "by": "emily8103",
      "linkedRestaurantCount": 0
    },
    {
      "id": "banh-xeo",
      "name": "Bánh xèo",
      "cuisine": "viet",
      "meals": [
        "toi",
        "chieu"
      ],
      "desc": "Bánh giòn vàng nhân tôm thịt, cuốn rau sống chấm nước mắm.",
      "photo": "photo-1788927783922-8b1299701b45",
      "by": "chonky_films",
      "linkedRestaurantCount": 3
    },
    {
      "id": "sushi",
      "name": "Sushi",
      "cuisine": "nhat",
      "meals": [
        "trua",
        "toi"
      ],
      "desc": "Cơm trộn giấm cuộn cá hồi, cá ngừ và rong biển.",
      "photo": "photo-1579584425555-c3ce17fd4351",
      "by": "derekduran",
      "linkedRestaurantCount": 0
    },
    {
      "id": "ramen",
      "name": "Ramen",
      "cuisine": "nhat",
      "meals": [
        "toi",
        "khuya"
      ],
      "desc": "Mì sợi dai trong nước dùng đậm, thịt xá xíu và trứng lòng đào.",
      "photo": "photo-1779453873118-0321c47aa1fd",
      "by": "karthickgislen",
      "linkedRestaurantCount": 0
    },
    {
      "id": "com-ca-ri",
      "name": "Cơm cà ri Nhật",
      "cuisine": "nhat",
      "meals": [
        "trua",
        "toi"
      ],
      "desc": "Cà ri sánh, ngọt nhẹ với khoai tây, cà rốt và thịt.",
      "photo": "photo-1679279727895-bd5c9fb9c1a0",
      "by": "cohesionsingapore",
      "linkedRestaurantCount": 0
    },
    {
      "id": "onigiri",
      "name": "Onigiri",
      "cuisine": "nhat",
      "meals": [
        "sang",
        "khuya",
        "chieu"
      ],
      "desc": "Cơm nắm tam giác bọc rong biển, nhân cá hồi hoặc mơ muối.",
      "photo": "photo-1757961047498-198b406685ed",
      "by": "madeline_sd",
      "linkedRestaurantCount": 0
    },
    {
      "id": "udon",
      "name": "Udon",
      "cuisine": "nhat",
      "meals": [
        "trua",
        "toi"
      ],
      "desc": "Sợi mì to dày trong nước dùng dashi thanh, ăn kèm tempura.",
      "photo": "photo-1761984336917-615bc6f7d4fa",
      "by": "pafuxu",
      "linkedRestaurantCount": 0
    },
    {
      "id": "bibimbap",
      "name": "Bibimbap",
      "cuisine": "han",
      "meals": [
        "trua"
      ],
      "desc": "Cơm trộn rau củ, thịt bò, trứng ốp và tương ớt gochujang.",
      "photo": "photo-1718777791239-c473e9ce7376",
      "by": "switchinglanes",
      "linkedRestaurantCount": 0
    },
    {
      "id": "tteokbokki",
      "name": "Tteokbokki",
      "cuisine": "han",
      "meals": [
        "toi",
        "khuya",
        "chieu"
      ],
      "desc": "Bánh gạo dẻo sốt cay ngọt, thêm chả cá và trứng luộc.",
      "photo": "photo-1747228469541-f0e7f56e7ec7",
      "by": "sobalc",
      "linkedRestaurantCount": 0
    },
    {
      "id": "ga-ran",
      "name": "Gà rán Hàn Quốc",
      "cuisine": "han",
      "meals": [
        "toi",
        "khuya",
        "chieu"
      ],
      "desc": "Gà chiên giòn phủ sốt cay ngọt hoặc tỏi mật ong.",
      "photo": "photo-1766589221562-e16eeacca795",
      "by": "diegoarenasderodrigo",
      "linkedRestaurantCount": 0
    },
    {
      "id": "kimbap",
      "name": "Kimbap",
      "cuisine": "han",
      "meals": [
        "sang",
        "trua",
        "chieu"
      ],
      "desc": "Cơm cuộn rong biển với trứng, rau củ và xúc xích.",
      "photo": "photo-1608731002187-d3448d224d18",
      "by": "deviyahya",
      "linkedRestaurantCount": 0
    },
    {
      "id": "canh-kim-chi",
      "name": "Canh kim chi",
      "cuisine": "han",
      "meals": [
        "trua",
        "toi"
      ],
      "desc": "Canh kim chi chua cay nấu với thịt heo và đậu phụ.",
      "photo": "photo-1760228865341-675704c22a5b",
      "by": "rawkkim",
      "linkedRestaurantCount": 0
    },
    {
      "id": "dimsum",
      "name": "Dimsum",
      "cuisine": "trung",
      "meals": [
        "sang",
        "trua",
        "chieu"
      ],
      "desc": "Há cảo, xíu mại hấp nhỏ xinh nhân tôm thịt, ăn kèm trà nóng.",
      "photo": "photo-1763994679303-fa1f6a7bf687",
      "by": "fenghua1975",
      "linkedRestaurantCount": 0
    },
    {
      "id": "mi-hoanh-thanh",
      "name": "Mì hoành thánh",
      "cuisine": "trung",
      "meals": [
        "sang",
        "khuya"
      ],
      "desc": "Mì trứng và hoành thánh nhân tôm thịt trong nước dùng ngọt.",
      "photo": "photo-1746183055178-e4d5889140f0",
      "by": "runninghead",
      "linkedRestaurantCount": 0
    },
    {
      "id": "vit-quay",
      "name": "Vịt quay Bắc Kinh",
      "cuisine": "trung",
      "meals": [
        "toi"
      ],
      "desc": "Da vịt giòn bóng, cuốn bánh mỏng với hành lá và tương ngọt.",
      "photo": "photo-1765441012353-10fb4701a276",
      "by": "retter",
      "linkedRestaurantCount": 0
    },
    {
      "id": "mapo-tofu",
      "name": "Đậu phụ Tứ Xuyên",
      "cuisine": "trung",
      "meals": [
        "toi"
      ],
      "desc": "Mapo tofu: đậu phụ non sốt thịt băm cay tê đặc trưng Tứ Xuyên.",
      "photo": "photo-1788603930622-636954e00065",
      "by": "zoshuacolah",
      "linkedRestaurantCount": 0
    },
    {
      "id": "com-chien-duong-chau",
      "name": "Cơm chiên Dương Châu",
      "cuisine": "trung",
      "meals": [
        "trua",
        "toi",
        "khuya"
      ],
      "desc": "Cơm chiên tơi với trứng, lạp xưởng, tôm và đậu Hà Lan.",
      "photo": "photo-1603133872878-684f208fb84b",
      "by": "krizphoto",
      "linkedRestaurantCount": 0
    },
    {
      "id": "pad-thai",
      "name": "Pad Thai",
      "cuisine": "thai",
      "meals": [
        "trua",
        "toi"
      ],
      "desc": "Bánh phở xào sốt me chua ngọt với tôm, trứng và đậu phộng.",
      "photo": "photo-1637806930600-37fa8892069d",
      "by": "johnaledja",
      "linkedRestaurantCount": 0
    },
    {
      "id": "tom-yum",
      "name": "Tom Yum",
      "cuisine": "thai",
      "meals": [
        "toi"
      ],
      "desc": "Canh chua cay thơm sả, riềng, lá chanh, nấu với tôm.",
      "photo": "photo-1761037994516-502ed10932b0",
      "crop": "&crop=focalpoint&fp-x=.5&fp-y=.8&fp-z=1.4",
      "by": "moeupheap",
      "linkedRestaurantCount": 0
    },
    {
      "id": "ca-ri-xanh",
      "name": "Cà ri xanh",
      "cuisine": "thai",
      "meals": [
        "trua",
        "toi"
      ],
      "desc": "Cà ri nước cốt dừa cay nhẹ với gà và cà tím.",
      "photo": "photo-1716959669858-11d415bdead6",
      "by": "le_y0u",
      "linkedRestaurantCount": 0
    },
    {
      "id": "pad-kra-pao",
      "name": "Gà xào húng quế",
      "cuisine": "thai",
      "meals": [
        "trua",
        "khuya"
      ],
      "desc": "Pad kra pao: gà băm xào ớt và húng quế Thái, ăn cùng cơm và trứng ốp.",
      "photo": "photo-1696906594893-e9995c4d7082",
      "by": "jointstar",
      "linkedRestaurantCount": 0
    },
    {
      "id": "xoi-xoai",
      "name": "Xôi xoài",
      "cuisine": "thai",
      "meals": [
        "sang",
        "khuya",
        "chieu"
      ],
      "desc": "Xôi nếp dẻo rưới nước cốt dừa, ăn cùng xoài chín.",
      "photo": "photo-1705234384751-84081009588e",
      "by": "markuswinkler",
      "vegetarianReview": {
        "status": "reviewed",
        "scope": "Phiên bản xôi nếp, xoài, nước cốt dừa, đường, muối và mè; không thêm nguyên liệu động vật.",
        "ingredients": [
          "gạo nếp",
          "xoài",
          "nước cốt dừa",
          "đường",
          "muối",
          "mè"
        ],
        "source": "https://www.bbcgoodfood.com/recipes/sticky-rice-mango",
        "reviewedAt": "2026-11-01"
      },
      "linkedRestaurantCount": 0
    },
    {
      "id": "pizza-margherita",
      "name": "Pizza Margherita",
      "cuisine": "y",
      "meals": [
        "trua",
        "toi",
        "khuya"
      ],
      "desc": "Đế mỏng nướng lò, sốt cà chua, phô mai mozzarella và húng quế.",
      "photo": "photo-1574071318508-1cdbab80d002",
      "by": "aurel__lens",
      "linkedRestaurantCount": 0
    },
    {
      "id": "mi-y-carbonara",
      "name": "Mì Ý Carbonara",
      "cuisine": "y",
      "meals": [
        "trua",
        "toi"
      ],
      "desc": "Mì Ý sốt trứng, phô mai pecorino và thịt heo muối.",
      "photo": "photo-1588013273468-315fd88ea34c",
      "by": "fresh_studio",
      "linkedRestaurantCount": 0
    },
    {
      "id": "lasagna",
      "name": "Lasagna",
      "cuisine": "y",
      "meals": [
        "toi"
      ],
      "desc": "Các lớp mì lá xen sốt thịt bò bằm và sốt kem, nướng phô mai.",
      "photo": "photo-1709429790175-b02bb1b19207",
      "by": "emanuelekstrom",
      "linkedRestaurantCount": 0
    },
    {
      "id": "risotto-nam",
      "name": "Risotto nấm",
      "cuisine": "y",
      "meals": [
        "toi"
      ],
      "desc": "Gạo Ý nấu sánh với nấm và phô mai parmesan.",
      "photo": "photo-1633964913295-ceb43826e7c9",
      "by": "robwicks",
      "linkedRestaurantCount": 0,
      "nutritionProfile": {
        "dishId": "risotto-nam",
        "scope": "Chỉ phiên bản Mushroom risotto của Diabetes UK: gạo risotto, nấm, Parmesan và sữa chua Hy Lạp 0% béo, theo đúng công thức nguồn; không tính món kèm.",
        "sourceLabel": "Diabetes UK · Mushroom risotto",
        "source": "https://www.diabetes.org.uk/living-with-diabetes/recipes/mushroom-risotto",
        "serving": "1 phần thành phẩm 306 g (công thức chia 3 phần)",
        "values": {
          "energyKcal": 282,
          "sugarsG": 5.8,
          "carbohydrateG": 49.4
        },
        "foodForm": "solid",
        "servingQuantity": 306,
        "servingUnit": "g",
        "dataNote": "Số liệu cho toàn bộ phần risotto của công thức Diabetes UK, không gồm gợi ý ăn kèm. 49,4 g carbohydrate và 282 kcal/phần; không suy số liệu sang phiên bản khác hoặc món tại quán.",
        "checkedAt": "2026-11-02",
        "scopeType": "reference-variant"
      },
      "nutritionReviews": [
        {
          "key": "low-sugar",
          "basis": "5,8 g đường/306 g thành phẩm ≈ 1,90 g/100 g, dưới ngưỡng 5 g/100 g. Nguồn cũng công bố Low sugar. Không có nghĩa là ít carbohydrate hay ít năng lượng.",
          "status": "verified",
          "scopeType": "reference-variant",
          "scope": "Chỉ phiên bản Mushroom risotto của Diabetes UK: gạo risotto, nấm, Parmesan và sữa chua Hy Lạp 0% béo, theo đúng công thức nguồn; không tính món kèm.",
          "source": "https://www.diabetes.org.uk/living-with-diabetes/recipes/mushroom-risotto",
          "criterionSource": "https://food.ec.europa.eu/food-safety/labelling-and-nutrition/nutrition-and-health-claims/nutrition-claims_en",
          "checkedAt": "2026-11-02"
        }
      ]
    },
    {
      "id": "bruschetta",
      "name": "Bruschetta",
      "cuisine": "y",
      "meals": [
        "sang",
        "trua",
        "chieu"
      ],
      "desc": "Bánh mì nướng giòn phủ cà chua, tỏi và dầu ô liu.",
      "photo": "photo-1786918517795-c3abeee741c2",
      "by": "culinarissimo",
      "vegetarianReview": {
        "status": "reviewed",
        "scope": "Phiên bản bánh mì cà chua, tỏi và dầu ô liu được mô tả; không thêm thịt, cá, phô mai hoặc mỡ động vật.",
        "ingredients": [
          "bánh mì không mỡ động vật",
          "cà chua",
          "tỏi",
          "dầu ô liu",
          "húng quế",
          "muối"
        ],
        "source": "https://www.tesco.com/recipes/en-GB/recipe/tomato-and-basil-bruschetta/cooking",
        "reviewedAt": "2026-11-01"
      },
      "linkedRestaurantCount": 0
    },
    {
      "id": "mi-quang",
      "name": "Mì Quảng",
      "cuisine": "viet",
      "meals": [
        "sang",
        "trua",
        "toi"
      ],
      "desc": "Mì Quảng với các phiên bản tôm thịt hoặc ếch tùy quán.",
      "imageUrl": "/images/restaurants/photo-1569718212165-3a8278d5f624.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-001",
          "dn-066",
          "dn-078",
          "dn-093"
        ]
      },
      "linkedRestaurantCount": 4
    },
    {
      "id": "bun-cha-ca",
      "name": "Bún chả cá",
      "cuisine": "viet",
      "meals": [
        "sang",
        "trua",
        "toi"
      ],
      "desc": "Bún chả cá được nhắc đến trong danh sách quán Đà Nẵng.",
      "imageUrl": "/images/restaurants/photo-1582878826629-29b7ad1cdc43.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-002",
          "dn-003"
        ]
      },
      "linkedRestaurantCount": 2
    },
    {
      "id": "banh-trang-thit-heo",
      "name": "Bánh tráng cuốn thịt heo",
      "cuisine": "viet",
      "meals": [
        "trua",
        "toi"
      ],
      "desc": "Bánh tráng thịt heo; phần ăn và món kèm tùy quán.",
      "imageUrl": "/images/restaurants/photo-1534422298391-e4f8c172dddb.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-004",
          "dn-005"
        ]
      },
      "linkedRestaurantCount": 2
    },
    {
      "id": "nem-lui",
      "name": "Nem lụi",
      "cuisine": "viet",
      "meals": [
        "trua",
        "chieu",
        "toi"
      ],
      "desc": "Nem lụi trong các món đặc trưng của Bánh Xèo Bà Dưỡng.",
      "imageUrl": "/images/restaurants/photo-1565299585323-38d6b0865b47.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-006"
        ]
      },
      "linkedRestaurantCount": 1
    },
    {
      "id": "bun-mam-thit-quay",
      "name": "Bún mắm thịt quay",
      "cuisine": "viet",
      "meals": [
        "sang",
        "trua",
        "toi"
      ],
      "desc": "Bún mắm thịt quay được giới thiệu tại Bún Mắm Vân.",
      "imageUrl": "/images/restaurants/photo-1546069901-ba9599a7e63c.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-007"
        ]
      },
      "linkedRestaurantCount": 1
    },
    {
      "id": "bun-bo",
      "name": "Bún bò",
      "cuisine": "viet",
      "meals": [
        "chieu",
        "toi",
        "sang",
        "trua"
      ],
      "desc": "Bún bò ở các quán được liên kết; khác với món bún chả cá.",
      "imageUrl": "/images/restaurants/photo-1582878826629-29b7ad1cdc43.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-008",
          "dn-009"
        ]
      },
      "linkedRestaurantCount": 2
    },
    {
      "id": "com-ga",
      "name": "Cơm gà",
      "cuisine": "viet",
      "meals": [
        "trua",
        "toi"
      ],
      "desc": "Cơm gà với lựa chọn xối mỡ tại A Hải và cơm gà Hồng Ngọc.",
      "imageUrl": "/images/restaurants/photo-1598515214211-89d3c73ae83b.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-010",
          "dn-011"
        ]
      },
      "linkedRestaurantCount": 2
    },
    {
      "id": "pizza-pho-mai",
      "name": "Pizza phô mai tươi",
      "cuisine": "y",
      "meals": [
        "trua",
        "toi"
      ],
      "desc": "Pizza phô mai tươi; chưa xác nhận là phiên bản Margherita.",
      "imageUrl": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=900&q=75",
      "imageSource": {
        "label": "Unsplash · aurel__lens · ảnh minh họa",
        "url": "https://unsplash.com/@aurel__lens"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-013"
        ]
      },
      "linkedRestaurantCount": 1
    },
    {
      "id": "bo-bit-tet",
      "name": "Bò bít tết",
      "cuisine": "quoc-te",
      "meals": [
        "trua",
        "toi"
      ],
      "desc": "Bò bít tết được nêu trong các món đặc trưng của quán.",
      "imageUrl": "/images/restaurants/photo-1544025162-d76694265947.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1544025162-d76694265947?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-014"
        ]
      },
      "linkedRestaurantCount": 1,
      "nutritionProfile": {
        "dishId": "bo-bit-tet",
        "scope": "Chỉ thịt bò vai nạc nướng nguyên vị, không sốt, đường ướp, bánh mì hay khoai ăn kèm.",
        "sourceLabel": "USDA ARS · Retail Beef Cuts, Release 3.01 (2013), trang 31",
        "source": "https://www.ars.usda.gov/ARSUserFiles/80400525/Data/Beef/Retail_Beef_Cuts03.pdf#page=34",
        "serving": "100 g thịt bò vai nạc nướng (shoulder steak, boneless, select; NDB 13946)",
        "values": {
          "energyKcal": 169,
          "sugarsG": 0,
          "carbohydrateG": 0
        },
        "foodForm": "solid",
        "servingQuantity": 100,
        "servingUnit": "g",
        "dataNote": "USDA ghi đường và carbohydrate bằng 0 theo mã nguồn 7 (assumed zero); năng lượng theo mã 4 (imputed). Không phải xét nghiệm phần ăn tại quán.",
        "checkedAt": "2026-11-02",
        "scopeType": "reference-variant"
      },
      "nutritionReviews": [
        {
          "key": "low-sugar",
          "basis": "Nguồn ghi 0 g đường/100 g thịt nạc nướng; dưới ngưỡng 5 g/100 g cho thức ăn rắn.",
          "status": "verified",
          "scopeType": "reference-variant",
          "scope": "Chỉ thịt bò vai nạc nướng nguyên vị, không sốt, đường ướp, bánh mì hay khoai ăn kèm.",
          "source": "https://www.ars.usda.gov/ARSUserFiles/80400525/Data/Beef/Retail_Beef_Cuts03.pdf#page=34",
          "criterionSource": "https://food.ec.europa.eu/food-safety/labelling-and-nutrition/nutrition-and-health-claims/nutrition-claims_en",
          "checkedAt": "2026-11-02"
        }
      ]
    },
    {
      "id": "mam-com-gia-dinh",
      "name": "Mâm cơm gia đình",
      "cuisine": "viet",
      "meals": [
        "trua",
        "toi"
      ],
      "desc": "Mâm cơm gia đình, các món trong mâm tùy thực đơn của quán.",
      "imageUrl": "/images/restaurants/photo-1547592180-85f173990554.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1547592180-85f173990554?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-017"
        ]
      },
      "linkedRestaurantCount": 1
    },
    {
      "id": "met-cuon",
      "name": "Mẹt cuốn tổng hợp",
      "cuisine": "viet",
      "meals": [
        "trua",
        "toi"
      ],
      "desc": "Mẹt cuốn tổng hợp được giới thiệu tại Bếp Cuốn.",
      "imageUrl": "/images/restaurants/dn-018.jpg",
      "imageSource": {
        "label": "Bếp Cuốn · website chính thức",
        "url": "https://bepcuon.net/"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-018"
        ]
      },
      "linkedRestaurantCount": 1
    },
    {
      "id": "banh-beo",
      "name": "Bánh bèo",
      "cuisine": "viet",
      "meals": [
        "sang",
        "chieu"
      ],
      "desc": "Một trong những món bánh được nêu tại Bánh Bèo Bà Bé.",
      "imageUrl": "/images/restaurants/photo-1509722747041-616f39b57569.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-019"
        ]
      },
      "linkedRestaurantCount": 1
    },
    {
      "id": "banh-nam",
      "name": "Bánh nậm",
      "cuisine": "viet",
      "meals": [
        "sang",
        "chieu"
      ],
      "desc": "Bánh nậm trong nhóm bánh bèo, nậm, lọc của quán.",
      "imageUrl": "/images/restaurants/photo-1509722747041-616f39b57569.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-019"
        ]
      },
      "linkedRestaurantCount": 1
    },
    {
      "id": "banh-bot-loc",
      "name": "Bánh bột lọc",
      "cuisine": "viet",
      "meals": [
        "sang",
        "chieu"
      ],
      "desc": "Bánh lọc; nhân và nước chấm cần xem thực đơn của quán.",
      "imageUrl": "/images/restaurants/photo-1509722747041-616f39b57569.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-019"
        ]
      },
      "linkedRestaurantCount": 1
    },
    {
      "id": "banh-canh",
      "name": "Bánh canh",
      "cuisine": "viet",
      "meals": [
        "chieu",
        "toi"
      ],
      "desc": "Bánh canh tại quán Ruộng Phương và Bánh Canh Chờ.",
      "imageUrl": "/images/restaurants/photo-1569718212165-3a8278d5f624.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-020",
          "dn-064"
        ]
      },
      "linkedRestaurantCount": 2
    },
    {
      "id": "oc-hut",
      "name": "Ốc hút",
      "cuisine": "viet",
      "meals": [
        "chieu",
        "toi",
        "sang"
      ],
      "desc": "Ốc hút, một lựa chọn ăn vặt được nhắc ở nhiều địa điểm.",
      "imageUrl": "/images/restaurants/photo-1565557623262-b51c2513a641.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-021",
          "dn-055",
          "dn-063",
          "dn-081"
        ]
      },
      "linkedRestaurantCount": 4
    },
    {
      "id": "mit-tron",
      "name": "Mít trộn",
      "cuisine": "viet",
      "meals": [
        "chieu",
        "toi"
      ],
      "desc": "Mít trộn; thành phần và phần ăn khác nhau tùy quán.",
      "imageUrl": "/images/restaurants/photo-1565557623262-b51c2513a641.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-021",
          "dn-022"
        ]
      },
      "linkedRestaurantCount": 2
    },
    {
      "id": "ram-cuon-cai",
      "name": "Ram cuốn cải",
      "cuisine": "viet",
      "meals": [
        "chieu",
        "toi"
      ],
      "desc": "Ram cuốn cải tại khu phố Đào Duy Từ.",
      "imageUrl": "/images/restaurants/photo-1606755962773-d324e0a13086.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-023"
        ]
      },
      "linkedRestaurantCount": 1
    },
    {
      "id": "banh-trang-kep",
      "name": "Bánh tráng kẹp",
      "cuisine": "viet",
      "meals": [
        "chieu",
        "toi"
      ],
      "desc": "Bánh tráng kẹp; nhân bánh tùy lựa chọn của quán.",
      "imageUrl": "/images/restaurants/photo-1565299624946-b28f40a0ae38.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-024",
          "dn-025"
        ]
      },
      "linkedRestaurantCount": 2
    },
    {
      "id": "yaourt-muoi",
      "name": "Yaourt muối",
      "cuisine": "viet",
      "meals": [
        "chieu",
        "toi"
      ],
      "desc": "Yaourt muối được giới thiệu tại quán Cô Tuyết.",
      "imageUrl": "/images/restaurants/photo-1488477181946-6428a0291777.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-026"
        ]
      },
      "linkedRestaurantCount": 1
    },
    {
      "id": "che-sau-rieng",
      "name": "Chè sầu riêng",
      "cuisine": "viet",
      "meals": [
        "trua",
        "chieu",
        "toi"
      ],
      "desc": "Chè sầu riêng được nêu trong các món đặc trưng của Chè Liên.",
      "imageUrl": "/images/restaurants/photo-1563805042-7684c019e1cb.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-027"
        ]
      },
      "linkedRestaurantCount": 1
    },
    {
      "id": "che-dau",
      "name": "Chè đậu",
      "cuisine": "viet",
      "meals": [
        "chieu",
        "toi"
      ],
      "desc": "Chè đậu tại Chè Xuân Trang; loại đậu tùy thực đơn.",
      "imageUrl": "/images/restaurants/photo-1551024709-8f23befc6f87.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-028"
        ]
      },
      "linkedRestaurantCount": 1
    },
    {
      "id": "che-thap-cam",
      "name": "Chè thập cẩm",
      "cuisine": "viet",
      "meals": [
        "chieu",
        "toi"
      ],
      "desc": "Chè thập cẩm, thành phần thay đổi theo cách làm của quán.",
      "imageUrl": "/images/restaurants/photo-1551024709-8f23befc6f87.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-028"
        ]
      },
      "linkedRestaurantCount": 1
    },
    {
      "id": "kem-bo",
      "name": "Kem bơ",
      "cuisine": "viet",
      "meals": [
        "sang",
        "chieu"
      ],
      "desc": "Kem bơ ở các địa điểm Cô Vân được liệt kê.",
      "imageUrl": "/images/restaurants/photo-1501443762994-82bd5dace89a.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-029",
          "dn-062"
        ]
      },
      "linkedRestaurantCount": 2
    },
    {
      "id": "banh-kem",
      "name": "Bánh kem",
      "cuisine": "quoc-te",
      "meals": [
        "sang",
        "chieu",
        "toi"
      ],
      "desc": "Bánh kem, kích cỡ và trang trí cần liên hệ từng tiệm.",
      "imageUrl": "/images/restaurants/photo-1578985545062-69928b1d9587.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-034",
          "dn-083"
        ]
      },
      "linkedRestaurantCount": 2
    },
    {
      "id": "banh-su-kem",
      "name": "Bánh su kem",
      "cuisine": "quoc-te",
      "meals": [
        "sang",
        "chieu",
        "toi"
      ],
      "desc": "Bánh su kem trong các món bánh của MiaCake.",
      "imageUrl": "/images/restaurants/photo-1578985545062-69928b1d9587.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-034"
        ]
      },
      "linkedRestaurantCount": 1
    },
    {
      "id": "croissant",
      "name": "Croissant",
      "cuisine": "quoc-te",
      "meals": [
        "sang",
        "chieu"
      ],
      "desc": "Bánh croissant được nêu tại Bonjour Resto’ Bakery.",
      "imageUrl": "/images/restaurants/photo-1530610476181-d83430b64dcd.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1530610476181-d83430b64dcd?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-035"
        ]
      },
      "linkedRestaurantCount": 1
    },
    {
      "id": "tiramisu",
      "name": "Tiramisu",
      "cuisine": "y",
      "meals": [
        "sang",
        "chieu",
        "toi"
      ],
      "desc": "Tiramisu tại các tiệm bánh có thông tin món này.",
      "imageUrl": "/images/restaurants/photo-1530610476181-d83430b64dcd.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1530610476181-d83430b64dcd?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-035",
          "dn-083"
        ]
      },
      "linkedRestaurantCount": 2
    },
    {
      "id": "bong-lan-trung-muoi",
      "name": "Bông lan trứng muối",
      "cuisine": "viet",
      "meals": [
        "sang",
        "chieu",
        "toi"
      ],
      "desc": "Bánh bông lan trứng muối được giới thiệu tại Napom’s Bakery.",
      "imageUrl": "/images/restaurants/photo-1586985289688-ca3cf47d3e6e.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-036"
        ]
      },
      "linkedRestaurantCount": 1
    },
    {
      "id": "ca-phe-cot-dua",
      "name": "Cà phê cốt dừa",
      "cuisine": "viet",
      "meals": [
        "sang",
        "trua",
        "chieu",
        "toi"
      ],
      "desc": "Cà phê cốt dừa được nêu tại Cộng Cà Phê.",
      "imageUrl": "/images/restaurants/photo-1514432324607-a09d9b4aefdd.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-037"
        ]
      },
      "linkedRestaurantCount": 1
    },
    {
      "id": "ca-phe-dac-san",
      "name": "Cà phê đặc sản",
      "cuisine": "quoc-te",
      "meals": [
        "sang",
        "chieu"
      ],
      "desc": "Specialty coffee; hạt và phương pháp pha theo thực đơn quán.",
      "imageUrl": "/images/restaurants/photo-1495474472287-4d71bcdd2085.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-038",
          "dn-040",
          "dn-071"
        ]
      },
      "linkedRestaurantCount": 3,
      "nutritionProfile": {
        "dishId": "ca-phe-dac-san",
        "scope": "Chỉ cà phê đen pha nước, không đường, sữa, kem hay siro.",
        "sourceLabel": "University of Rochester Medical Center",
        "source": "https://www.urmc.rochester.edu/encyclopedia/content?contentid=14209-1&contenttypeid=76",
        "serving": "1 cốc 8 US fl oz (khoảng 237 ml)",
        "values": {
          "energyKcal": 2.37,
          "sugarsG": 0,
          "carbohydrateG": 0
        },
        "foodForm": "liquid",
        "servingQuantity": 236.588,
        "servingUnit": "ml",
        "dataNote": "Số liệu tham khảo do University of Rochester Medical Center công bố; các giá trị 0 có thể đã làm tròn.",
        "checkedAt": "2026-11-02",
        "scopeType": "reference-variant"
      },
      "nutritionReviews": [
        {
          "key": "low-sugar",
          "basis": "Nguồn ghi 0 g đường/cốc; dưới ngưỡng 2,5 g/100 ml cho đồ uống.",
          "status": "verified",
          "scopeType": "reference-variant",
          "scope": "Chỉ cà phê đen pha nước, không đường, sữa, kem hay siro.",
          "source": "https://www.urmc.rochester.edu/encyclopedia/content?contentid=14209-1&contenttypeid=76",
          "criterionSource": "https://food.ec.europa.eu/food-safety/labelling-and-nutrition/nutrition-and-health-claims/nutrition-claims_en",
          "checkedAt": "2026-11-02"
        },
        {
          "key": "low-energy",
          "basis": "2,37 kcal/8 US fl oz, xấp xỉ 1 kcal/100 ml; dưới ngưỡng 20 kcal/100 ml.",
          "status": "verified",
          "scopeType": "reference-variant",
          "scope": "Chỉ cà phê đen pha nước, không đường, sữa, kem hay siro.",
          "source": "https://www.urmc.rochester.edu/encyclopedia/content?contentid=14209-1&contenttypeid=76",
          "criterionSource": "https://food.ec.europa.eu/food-safety/labelling-and-nutrition/nutrition-and-health-claims/nutrition-claims_en",
          "checkedAt": "2026-11-02"
        }
      ]
    },
    {
      "id": "nuoc-mia-sau-rieng",
      "name": "Nước mía sầu riêng",
      "cuisine": "viet",
      "meals": [
        "chieu",
        "toi"
      ],
      "desc": "Nước mía sầu riêng tại Nước Mía Bà Diệu.",
      "imageUrl": "/images/restaurants/photo-1513558161293-cdaf765ed2fd.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-041"
        ]
      },
      "linkedRestaurantCount": 1
    },
    {
      "id": "lau-nam-chay",
      "name": "Lẩu nấm chay",
      "cuisine": "viet",
      "meals": [
        "sang",
        "trua",
        "toi"
      ],
      "desc": "Lẩu nấm được nêu tại Chay An Lạc Tâm; thành phần cần hỏi quán.",
      "imageUrl": "/images/restaurants/photo-1512621776951-a57141f2eefd.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-042"
        ]
      },
      "vegetarianReview": {
        "status": "source-declared",
        "scope": "Món được giới thiệu là chay theo tên món và thông tin quán; chưa rà soát đầy đủ nguyên liệu, nước dùng và sốt.",
        "restaurantIds": [
          "dn-042"
        ]
      },
      "linkedRestaurantCount": 1
    },
    {
      "id": "com-chay",
      "name": "Cơm chay",
      "cuisine": "viet",
      "meals": [
        "sang",
        "trua",
        "toi"
      ],
      "desc": "Cơm chay và cơm chay tự chọn theo thực đơn từng quán.",
      "imageUrl": "/images/restaurants/photo-1512621776951-a57141f2eefd.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-042",
          "dn-043",
          "dn-102"
        ]
      },
      "vegetarianReview": {
        "status": "source-declared",
        "scope": "Món được giới thiệu là chay theo tên món và thông tin quán; chưa rà soát đầy đủ nguyên liệu, nước dùng và sốt.",
        "restaurantIds": [
          "dn-042",
          "dn-043",
          "dn-102"
        ]
      },
      "linkedRestaurantCount": 3
    },
    {
      "id": "bun-chay",
      "name": "Bún chay",
      "cuisine": "viet",
      "meals": [
        "sang",
        "trua",
        "toi"
      ],
      "desc": "Bún trong nhóm món được giới thiệu tại Chay Hương Sen.",
      "imageUrl": "/images/restaurants/photo-1540420773420-3366772f4999.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-043"
        ]
      },
      "vegetarianReview": {
        "status": "source-declared",
        "scope": "Món được giới thiệu là chay theo tên món và thông tin quán; chưa rà soát đầy đủ nguyên liệu, nước dùng và sốt.",
        "restaurantIds": [
          "dn-043"
        ]
      },
      "linkedRestaurantCount": 1
    },
    {
      "id": "mi-chay",
      "name": "Mì chay",
      "cuisine": "viet",
      "meals": [
        "sang",
        "trua",
        "toi"
      ],
      "desc": "Mì trong nhóm món của Chay Hương Sen; kiểm tra thành phần khi gọi.",
      "imageUrl": "/images/restaurants/photo-1540420773420-3366772f4999.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-043"
        ]
      },
      "vegetarianReview": {
        "status": "source-declared",
        "scope": "Món được giới thiệu là chay theo tên món và thông tin quán; chưa rà soát đầy đủ nguyên liệu, nước dùng và sốt.",
        "restaurantIds": [
          "dn-043"
        ]
      },
      "linkedRestaurantCount": 1
    },
    {
      "id": "banh-canh-cua",
      "name": "Bánh canh cua",
      "cuisine": "viet",
      "meals": [
        "chieu",
        "toi"
      ],
      "desc": "Bánh canh cua được nêu tại Bánh Canh Cua Quân.",
      "imageUrl": "/images/restaurants/photo-1569718212165-3a8278d5f624.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-051"
        ]
      },
      "linkedRestaurantCount": 1
    },
    {
      "id": "bun-hai-san",
      "name": "Bún hải sản bề bề",
      "cuisine": "viet",
      "meals": [
        "sang",
        "trua"
      ],
      "desc": "Bún hải sản bề bề tại địa điểm được liên kết.",
      "imageUrl": "/images/restaurants/photo-1582878826629-29b7ad1cdc43.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-052"
        ]
      },
      "linkedRestaurantCount": 1
    },
    {
      "id": "bach-tuoc-nuong",
      "name": "Bạch tuộc nướng",
      "cuisine": "viet",
      "meals": [
        "toi"
      ],
      "desc": "Lựa chọn tại khu chợ đêm, cần kiểm tra quầy bán cụ thể.",
      "imageUrl": "/images/restaurants/photo-1555939594-58d7cb561ad1.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-054"
        ]
      },
      "linkedRestaurantCount": 1
    },
    {
      "id": "xien-que",
      "name": "Xiên que",
      "cuisine": "viet",
      "meals": [
        "toi"
      ],
      "desc": "Các loại xiên que tại chợ đêm, nguyên liệu tùy quầy.",
      "imageUrl": "/images/restaurants/photo-1555939594-58d7cb561ad1.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-054"
        ]
      },
      "linkedRestaurantCount": 1
    },
    {
      "id": "oc-buou-tron",
      "name": "Ốc bươu trộn",
      "cuisine": "viet",
      "meals": [
        "chieu",
        "toi"
      ],
      "desc": "Ốc bươu trộn được nêu trong các món của Ốc Thanh.",
      "imageUrl": "/images/restaurants/photo-1565557623262-b51c2513a641.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-055"
        ]
      },
      "linkedRestaurantCount": 1
    },
    {
      "id": "ca-phe-bo",
      "name": "Cà phê bơ",
      "cuisine": "viet",
      "meals": [
        "sang",
        "trua",
        "chieu",
        "toi"
      ],
      "desc": "Cà phê bơ được giới thiệu tại Trình Cà Phê.",
      "imageUrl": "/images/restaurants/photo-1461023058943-07fcbe16d735.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-057"
        ]
      },
      "linkedRestaurantCount": 1
    },
    {
      "id": "cinnamon-roll",
      "name": "Cinnamon roll",
      "cuisine": "quoc-te",
      "meals": [
        "sang",
        "chieu"
      ],
      "desc": "Bánh cuộn quế được nêu tại Jeremy’s Kitchen.",
      "imageUrl": "/images/restaurants/photo-1509365465985-25d11c17e812.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1509365465985-25d11c17e812?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-058"
        ]
      },
      "linkedRestaurantCount": 1
    },
    {
      "id": "goi-cuon-chay",
      "name": "Gỏi cuốn chay",
      "cuisine": "viet",
      "meals": [
        "sang",
        "trua",
        "toi"
      ],
      "desc": "Gỏi cuốn được giới thiệu tại Chay Phúc An; cần hỏi về sốt chấm.",
      "imageUrl": "/images/restaurants/photo-1512621776951-a57141f2eefd.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-060"
        ]
      },
      "vegetarianReview": {
        "status": "source-declared",
        "scope": "Món được giới thiệu là chay theo tên món và thông tin quán; chưa rà soát đầy đủ nguyên liệu, nước dùng và sốt.",
        "restaurantIds": [
          "dn-060"
        ]
      },
      "linkedRestaurantCount": 1
    },
    {
      "id": "burger",
      "name": "Burger",
      "cuisine": "quoc-te",
      "meals": [
        "sang",
        "trua",
        "toi"
      ],
      "desc": "Burger tại Bikini Bottom Express; nhân bánh tùy thực đơn.",
      "imageUrl": "/images/restaurants/photo-1568901346375-23c9450c58cd.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-067"
        ]
      },
      "linkedRestaurantCount": 1
    },
    {
      "id": "pizza-cui",
      "name": "Pizza lò củi",
      "cuisine": "y",
      "meals": [
        "trua",
        "toi"
      ],
      "desc": "Pizza lò củi của L’Italiano; loại phủ mặt cần xem thực đơn.",
      "imageUrl": "/images/restaurants/photo-1574071318508-1cdbab80d002.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-068"
        ]
      },
      "linkedRestaurantCount": 1
    },
    {
      "id": "pasta-y",
      "name": "Pasta Ý",
      "cuisine": "y",
      "meals": [
        "trua",
        "toi"
      ],
      "desc": "Pasta Ý; chưa xác nhận riêng loại sốt Carbonara.",
      "imageUrl": "/images/restaurants/photo-1574071318508-1cdbab80d002.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-068"
        ]
      },
      "linkedRestaurantCount": 1
    },
    {
      "id": "tacos",
      "name": "Tacos",
      "cuisine": "quoc-te",
      "meals": [
        "trua",
        "toi"
      ],
      "desc": "Tacos tại Poca Taco; nhân và sốt tùy lựa chọn.",
      "imageUrl": "/images/restaurants/photo-1565299585323-38d6b0865b47.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-069"
        ]
      },
      "linkedRestaurantCount": 1
    },
    {
      "id": "bagel",
      "name": "Bagel",
      "cuisine": "quoc-te",
      "meals": [
        "sang",
        "chieu"
      ],
      "desc": "Bánh bagel được nêu tại The Hideout Cafe.",
      "imageUrl": "/images/restaurants/photo-1495474472287-4d71bcdd2085.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-070"
        ]
      },
      "linkedRestaurantCount": 1
    },
    {
      "id": "smoothie-bowl",
      "name": "Smoothie bowl",
      "cuisine": "quoc-te",
      "meals": [
        "sang",
        "chieu",
        "trua",
        "toi"
      ],
      "desc": "Sinh tố bowl tại các địa điểm có thông tin món này.",
      "imageUrl": "/images/restaurants/photo-1495474472287-4d71bcdd2085.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-070",
          "dn-072"
        ]
      },
      "linkedRestaurantCount": 2
    },
    {
      "id": "burger-chay",
      "name": "Burger chay",
      "cuisine": "quoc-te",
      "meals": [
        "sang",
        "trua",
        "toi"
      ],
      "desc": "Burger chay được nêu tại Roots; cần kiểm tra bánh và sốt.",
      "imageUrl": "/images/restaurants/photo-1512621776951-a57141f2eefd.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-072"
        ]
      },
      "vegetarianReview": {
        "status": "source-declared",
        "scope": "Món được giới thiệu là chay theo tên món và thông tin quán; chưa rà soát đầy đủ nguyên liệu, nước dùng và sốt.",
        "restaurantIds": [
          "dn-072"
        ]
      },
      "linkedRestaurantCount": 1
    },
    {
      "id": "banh-dap",
      "name": "Bánh đập",
      "cuisine": "viet",
      "meals": [
        "chieu",
        "toi"
      ],
      "desc": "Bánh đập tại khu đường Châu Thị Vĩnh Tế.",
      "imageUrl": "/images/restaurants/photo-1509722747041-616f39b57569.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-075"
        ]
      },
      "linkedRestaurantCount": 1
    },
    {
      "id": "hen-xao",
      "name": "Hến xào",
      "cuisine": "viet",
      "meals": [
        "chieu",
        "toi"
      ],
      "desc": "Hến xào được nêu cùng bánh đập tại khu vực này.",
      "imageUrl": "/images/restaurants/photo-1509722747041-616f39b57569.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-075"
        ]
      },
      "linkedRestaurantCount": 1
    },
    {
      "id": "banh-canh-ca-loc",
      "name": "Bánh canh cá lóc",
      "cuisine": "viet",
      "meals": [
        "sang",
        "chieu",
        "toi"
      ],
      "desc": "Bánh canh cá lóc tại Thanh Hương.",
      "imageUrl": "/images/restaurants/photo-1569718212165-3a8278d5f624.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-076"
        ]
      },
      "linkedRestaurantCount": 1
    },
    {
      "id": "bo-ne",
      "name": "Bò né",
      "cuisine": "viet",
      "meals": [
        "sang"
      ],
      "desc": "Bò né với ốp la, pate được giới thiệu tại quán Khanh.",
      "imageUrl": "/images/restaurants/photo-1544025162-d76694265947.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1544025162-d76694265947?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-077"
        ]
      },
      "linkedRestaurantCount": 1
    },
    {
      "id": "chao-vit",
      "name": "Cháo vịt",
      "cuisine": "viet",
      "meals": [
        "chieu",
        "toi"
      ],
      "desc": "Cháo vịt ở địa điểm Cháo Vịt Hải.",
      "imageUrl": "/images/restaurants/photo-1604908176997-125f25cc6f3d.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-079"
        ]
      },
      "linkedRestaurantCount": 1
    },
    {
      "id": "goi-vit",
      "name": "Gỏi vịt",
      "cuisine": "viet",
      "meals": [
        "chieu",
        "toi"
      ],
      "desc": "Gỏi vịt trộn được nêu trong các món đặc trưng của quán.",
      "imageUrl": "/images/restaurants/photo-1604908176997-125f25cc6f3d.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-079"
        ]
      },
      "linkedRestaurantCount": 1
    },
    {
      "id": "chao-dau-xanh",
      "name": "Cháo đậu xanh",
      "cuisine": "viet",
      "meals": [
        "chieu",
        "toi"
      ],
      "desc": "Cháo đậu xanh tại quán vịt; không mặc định là món chay.",
      "imageUrl": "/images/restaurants/photo-1604908176997-125f25cc6f3d.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-079"
        ]
      },
      "linkedRestaurantCount": 1
    },
    {
      "id": "pha-lau",
      "name": "Phá lấu",
      "cuisine": "viet",
      "meals": [
        "chieu",
        "toi"
      ],
      "desc": "Phá lấu ăn cùng bánh mì; không đồng nhất với bánh mì kẹp.",
      "imageUrl": "/images/restaurants/photo-1509722747041-616f39b57569.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-080"
        ]
      },
      "linkedRestaurantCount": 1
    },
    {
      "id": "cut-lon-xao-me",
      "name": "Cút lộn xào me",
      "cuisine": "viet",
      "meals": [
        "chieu",
        "toi"
      ],
      "desc": "Cút lộn xào me được nêu tại quán Cô Thảo.",
      "imageUrl": "/images/restaurants/photo-1546069901-ba9599a7e63c.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-082"
        ]
      },
      "linkedRestaurantCount": 1
    },
    {
      "id": "rau-ma-sau-rieng",
      "name": "Rau má sầu riêng",
      "cuisine": "viet",
      "meals": [
        "sang",
        "trua",
        "chieu",
        "toi"
      ],
      "desc": "Rau má sầu riêng trong danh sách đồ uống Rau Má Mix.",
      "imageUrl": "/images/restaurants/photo-1513558161293-cdaf765ed2fd.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-087"
        ]
      },
      "linkedRestaurantCount": 1
    },
    {
      "id": "rau-ma-dau-xanh",
      "name": "Rau má đậu xanh",
      "cuisine": "viet",
      "meals": [
        "sang",
        "trua",
        "chieu",
        "toi"
      ],
      "desc": "Rau má đậu xanh được giới thiệu tại Rau Má Mix.",
      "imageUrl": "/images/restaurants/photo-1513558161293-cdaf765ed2fd.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-087"
        ]
      },
      "linkedRestaurantCount": 1
    },
    {
      "id": "bun-mam-chay",
      "name": "Bún mắm chay",
      "cuisine": "viet",
      "meals": [
        "sang",
        "trua",
        "toi"
      ],
      "desc": "Bún mắm chay tại Chay Thúy; cần hỏi thành phần mắm và sốt.",
      "imageUrl": "/images/restaurants/photo-1512621776951-a57141f2eefd.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-088"
        ]
      },
      "vegetarianReview": {
        "status": "source-declared",
        "scope": "Món được giới thiệu là chay theo tên món và thông tin quán; chưa rà soát đầy đủ nguyên liệu, nước dùng và sốt.",
        "restaurantIds": [
          "dn-088"
        ]
      },
      "linkedRestaurantCount": 1
    },
    {
      "id": "banh-loc-chay",
      "name": "Bánh lọc chay",
      "cuisine": "viet",
      "meals": [
        "sang",
        "trua",
        "toi"
      ],
      "desc": "Bánh lọc chay được nêu tại Chay Thúy.",
      "imageUrl": "/images/restaurants/photo-1512621776951-a57141f2eefd.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-088"
        ]
      },
      "vegetarianReview": {
        "status": "source-declared",
        "scope": "Món được giới thiệu là chay theo tên món và thông tin quán; chưa rà soát đầy đủ nguyên liệu, nước dùng và sốt.",
        "restaurantIds": [
          "dn-088"
        ]
      },
      "linkedRestaurantCount": 1
    },
    {
      "id": "be-thui",
      "name": "Bê thui Cầu Mống",
      "cuisine": "viet",
      "meals": [
        "trua",
        "toi"
      ],
      "desc": "Bê thui Cầu Mống tại các quán có tên món tương ứng.",
      "imageUrl": "/images/restaurants/photo-1544025162-d76694265947.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1544025162-d76694265947?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-090",
          "dn-091"
        ]
      },
      "linkedRestaurantCount": 2
    },
    {
      "id": "banh-kho-me",
      "name": "Bánh khô mè",
      "cuisine": "viet",
      "meals": [
        "sang",
        "trua",
        "chieu",
        "toi"
      ],
      "desc": "Bánh khô mè, đặc sản được giới thiệu tại Bà Liễu Mẹ.",
      "imageUrl": "/images/restaurants/photo-1558961363-fa8fdf82db35.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-092"
        ]
      },
      "linkedRestaurantCount": 1
    },
    {
      "id": "goi-ca-nam-o",
      "name": "Gỏi cá Nam Ô",
      "cuisine": "viet",
      "meals": [
        "trua",
        "chieu",
        "toi"
      ],
      "desc": "Gỏi cá Nam Ô; lựa chọn khô hoặc ướt cần hỏi từng quán.",
      "imageUrl": "/images/restaurants/photo-1534422298391-e4f8c172dddb.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-094",
          "dn-095"
        ]
      },
      "linkedRestaurantCount": 2
    },
    {
      "id": "trung-chen-nuong",
      "name": "Trứng chén nướng",
      "cuisine": "viet",
      "meals": [
        "toi"
      ],
      "desc": "Món được nêu tại Chợ Đêm Hòa Khánh; tìm quầy trước khi gọi.",
      "imageUrl": "/images/restaurants/photo-1555939594-58d7cb561ad1.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-096"
        ]
      },
      "linkedRestaurantCount": 1
    },
    {
      "id": "chan-ga",
      "name": "Chân gà",
      "cuisine": "viet",
      "meals": [
        "toi"
      ],
      "desc": "Món chân gà tại khu chợ đêm; cách chế biến tùy quầy.",
      "imageUrl": "/images/restaurants/photo-1555939594-58d7cb561ad1.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-096"
        ]
      },
      "linkedRestaurantCount": 1
    },
    {
      "id": "lau-bo",
      "name": "Lẩu bò",
      "cuisine": "viet",
      "meals": [
        "chieu",
        "toi"
      ],
      "desc": "Lẩu bò được nêu tại Lẩu Bò Sáu Hưng.",
      "imageUrl": "/images/restaurants/photo-1547592180-85f173990554.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1547592180-85f173990554?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-097"
        ]
      },
      "linkedRestaurantCount": 1
    },
    {
      "id": "nuoc-ep",
      "name": "Nước ép",
      "cuisine": "viet",
      "meals": [
        "chieu",
        "toi"
      ],
      "desc": "Nước ép trái cây; loại trái cây và giá cần kiểm tra ở quán.",
      "imageUrl": "/images/restaurants/photo-1513558161293-cdaf765ed2fd.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-101"
        ]
      },
      "linkedRestaurantCount": 1
    },
    {
      "id": "sinh-to",
      "name": "Sinh tố",
      "cuisine": "viet",
      "meals": [
        "chieu",
        "toi"
      ],
      "desc": "Sinh tố trái cây tại quán Cô Bông, lựa chọn theo thực đơn.",
      "imageUrl": "/images/restaurants/photo-1513558161293-cdaf765ed2fd.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-101"
        ]
      },
      "linkedRestaurantCount": 1
    },
    {
      "id": "bun-rieu-chay",
      "name": "Bún riêu chay",
      "cuisine": "viet",
      "meals": [
        "sang",
        "trua",
        "toi"
      ],
      "desc": "Bún riêu chay được nêu tại Chay Tâm Đức.",
      "imageUrl": "/images/restaurants/photo-1512621776951-a57141f2eefd.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-102"
        ]
      },
      "vegetarianReview": {
        "status": "source-declared",
        "scope": "Món được giới thiệu là chay theo tên món và thông tin quán; chưa rà soát đầy đủ nguyên liệu, nước dùng và sốt.",
        "restaurantIds": [
          "dn-102"
        ]
      },
      "linkedRestaurantCount": 1
    },
    {
      "id": "lau-ga-la-e",
      "name": "Lẩu gà lá é",
      "cuisine": "viet",
      "meals": [
        "trua",
        "toi"
      ],
      "desc": "Lẩu gà lá é được giới thiệu tại Tao Ngộ, chi nhánh Cẩm Lệ.",
      "imageUrl": "/images/restaurants/photo-1547592180-85f173990554.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1547592180-85f173990554?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-104"
        ]
      },
      "linkedRestaurantCount": 1
    },
    {
      "id": "kem-xoi-dua",
      "name": "Kem xôi dừa",
      "cuisine": "viet",
      "meals": [
        "chieu",
        "toi"
      ],
      "desc": "Kem xôi dừa Mã Lai; khác với xôi xoài của Thái Lan.",
      "imageUrl": "/images/restaurants/photo-1563805042-7684c019e1cb.jpg",
      "imageSource": {
        "label": "Unsplash · ảnh minh họa",
        "url": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600"
      },
      "source": {
        "type": "restaurant-catalog",
        "restaurantIds": [
          "dn-105"
        ]
      },
      "linkedRestaurantCount": 1
    }
  ]
};
