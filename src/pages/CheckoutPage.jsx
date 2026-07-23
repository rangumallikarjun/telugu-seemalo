import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { fmt, NoImageIcon } from "../utils/helpers";
import { createOrder } from "../firebase/orderService";
import { collectDeviceFingerprint } from "../utils/deviceFingerprint";
import { notifyOrderPlaced } from "../firebase/notificationService";
import { validateCoupon, calcDiscount, applyCouponUsage, getPublicCoupons } from "../firebase/couponService";
import { debitWallet, subscribeWalletBalance, rechargeWallet } from "../firebase/walletService";
import RazorpayModal from "../components/RazorpayModal";

// ── India address data ───────────────────────────────────────────────────────
const INDIA_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa",
  "Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala",
  "Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland",
  "Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura",
  "Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman and Nicobar Islands","Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu","Delhi",
  "Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry",
];

const CITIES_BY_STATE = {
  "Andhra Pradesh":["Visakhapatnam","Vijayawada","Guntur","Nellore","Kurnool","Tirupati","Rajahmundry","Kakinada","Kadapa","Anantapur","Eluru","Ongole","Nandyal","Machilipatnam","Adoni","Tenali","Proddatur","Chittoor","Hindupur","Bhimavaram","Madanapalle","Guntakal","Dharmavaram","Gudivada","Narasaraopet","Tadipatri","Tadepalligudem","Chilakaluripet","Yemmiganur","Markapur","Vizianagaram","Srikakulam","Narasapuram","Palakollu","Palasa","Bobbili","Rajam","Tekkali","Salur","Parvatipuram","Amalapuram","Pithapuram","Tuni","Samalkot","Mandapeta","Kovvur","Nidadavole","Palakonda","Parvathipuram","Kukatpally","Bapatla","Sattenapalle","Piduguralla","Vinukonda","Macherla","Ponnur","Repalle","Nidubrolu","Nagunur","Atmakur","Dhone","Nandyal","Allagadda","Banaganapalle","Betamcherla","Giddalur","Yerragondapalem","Kanigiri","Podili","Ongole","Chirala","Vetapalem","Addanki","Chimakurti","Martur","Cumbum","Darsi","Kandukur","Kondapi","Pamur","Parchur","Tanguturu","Inkollu","Santanuthalapadu","Komarole","Zarugumilli","Ramachandrapuram"],
  "Arunachal Pradesh":["Itanagar","Naharlagun","Pasighat","Tezpur","Bomdila","Ziro","Along","Tezu","Roing","Khonsa","Changlang","Daporijo","Anini","Seppa","Tawang","Longding","Namsai","Yazali","Basar","Mechuka"],
  "Assam":["Guwahati","Silchar","Dibrugarh","Jorhat","Nagaon","Tinsukia","Tezpur","Bongaigaon","Dhubri","Diphu","Goalpara","Karimganj","Sivsagar","Golaghat","Barpeta","Lakhimpur","Hailakandi","Nalbari","Kokrajhar","Haflong","Lumding","Hojai","Morigaon","Rangia","Barpeta Road","North Lakhimpur","Sibsagar","Nazira","Sonari","Demow","Amguri","Sarupathar","Titabor","Mariani","Bokel","Furkating","Gauripur","Bilasipara","Abhayapuri","Bongaigaon","Sarbhog","Pathsala","Tihu","Chaygaon"],
  "Bihar":["Patna","Gaya","Bhagalpur","Muzaffarpur","Purnia","Darbhanga","Bihar Sharif","Arrah","Begusarai","Katihar","Munger","Chhapra","Danapur","Saharsa","Hajipur","Dehri","Siwan","Motihari","Nawada","Bagaha","Bettiah","Sasaram","Madhubani","Kishanganj","Aurangabad","Jehanabad","Nawada","Lakhisarai","Sheikhpura","Supaul","Araria","Khagaria","Buxar","Kaimur","Rohtas","Sheohar","Sitamarhi","Vaishali","Samastipur","Madhepura","Saran","Gopalganj","West Champaran","East Champaran","Jamui","Banka","Munger","Lakhisarai","Sherghati","Bodh Gaya","Rajgir","Barh","Mokama","Fatuha","Khusrupur","Bakhtiyarpur","Hilsa","Islampur","Barbigha","Chandi","Asthawan","Biharsharif","Nalanda","Bihta","Masaurhi"],
  "Chhattisgarh":["Raipur","Bhilai","Bilaspur","Korba","Durg","Rajnandgaon","Jagdalpur","Raigarh","Ambikapur","Dhamtari","Mahasamund","Kanker","Janjgir","Champa","Sakti","Mungeli","Kawardha","Balod","Baloda Bazar","Bemetara","Gariaband","Kondagaon","Sukma","Narayanpur","Bijapur","Surajpur","Balrampur","Jashpur","Korea","Baikunthpur","Manendragarh","Sarguja","Dongargarh","Tilda","Arang","Abhanpur","Dharsiwa","Simga","Bhatapara","Kasdol","Pithora"],
  "Goa":["Panaji","Vasco da Gama","Margao","Mapusa","Ponda","Bicholim","Curchorem","Calangute","Baga","Anjuna","Candolim","Vagator","Pernem","Sanguem","Canacona","Quepem","Valpoi","Cuncolim","Sanquelim","Cortalim","Corjuem","Aldona","Saligao","Porvorim","Taleigao","Bambolim","Agassaim","Miramar","Caranzalem","Dona Paula"],
  "Gujarat":["Ahmedabad","Surat","Vadodara","Rajkot","Bhavnagar","Jamnagar","Junagadh","Gandhinagar","Anand","Nadiad","Morbi","Mehsana","Bharuch","Porbandar","Palanpur","Valsad","Navsari","Veraval","Surendranagar","Gandhidham","Godhra","Patan","Dahod","Amreli","Botad","Dwarka","Vyara","Bardoli","Ankleshwar","Vapi","Daman","Silvassa","Gondal","Jetpur","Wankaner","Dhrangadhra","Halvad","Limbdi","Wadhwan","Chotila","Jasdan","Dhoraji","Upleta","Rajula","Mahuva","Sihor","Talaja","Palitana","Ghogha","Okha","Salaya","Khambhalia","Kalawad","Paddhari","Gondal","Vinchhiya","Tankara","Morbi","Maliya Miyana","Wankaner","Dhrangadhra","Viramgam","Sanand","Bavla","Dholka","Dhandhuka","Ranpur","Borsad","Kheda","Matar","Petlad","Umreth","Anand","Vallabh Vidyanagar","Karamsad","Tarapur","Sojitra","Kapadvanj","Mahudha","Kathlal","Thasra","Lunawada","Halol","Kalol","Modasa","Idar","Himatnagar","Shamlaji","Khedbrahma","Prantij","Unjha","Visnagar","Kadi","Mansa","Vijapur","Sidhpur","Patan","Chanasma","Harij","Radhanpur","Thrad","Disa","Palanpur","Deesa","Dantiwada","Vadgam","Vav","Sami","Santalpur","Kankrej","Tharad","Dhanera","Bhabhar"],
  "Haryana":["Faridabad","Gurgaon","Panipat","Ambala","Yamunanagar","Rohtak","Hisar","Karnal","Sonipat","Panchkula","Bhiwani","Sirsa","Bahadurgarh","Jind","Thanesar","Kaithal","Rewari","Palwal","Narnaul","Fatehabad","Mahendragarh","Nuh","Jhajjar","Charkhi Dadri","Hansi","Tosham","Adampur","Uklana","Barwala","Fatehabad","Ratia","Jakhal","Tohana","Bhuna","Narwana","Safidon","Julana","Uchana","Assandh","Gharaunda","Indri","Nilokheri","Taraori","Pehowa","Shahabad","Ladwa","Ismailabad","Kurukshetra","Pundri"],
  "Himachal Pradesh":["Shimla","Mandi","Solan","Dharamshala","Kullu","Hamirpur","Una","Nahan","Palampur","Baddi","Bilaspur","Chamba","Kangra","Nurpur","Dalhousie","Manali","Kasauli","Parwanoo","Nalagarh","Sundernagar","Rampur","Rekong Peo","Sangla","Kalpa","Spiti","Keylong","Udaipur","Tabo","Kaza","Chail","Arki","Sarkaghat","Sujanpur","Dera Gopipur","Jawali","Bhota","Amb","Barsar","Multhan","Gagret","Haroli","Bangana"],
  "Jharkhand":["Ranchi","Jamshedpur","Dhanbad","Bokaro","Deoghar","Hazaribagh","Giridih","Ramgarh","Medininagar","Chakradharpur","Phusro","Chirkunda","Jharia","Sindri","Godda","Dumka","Pakur","Sahibganj","Rajmahal","Lohardaga","Gumla","Simdega","Khunti","Saraikela","Chaibasa","Chakulia","Baharagora","Ghatsila","Musabani","Adityapur","Gamharia","Mango","Jugsalai","Baharagora"],
  "Karnataka":["Bengaluru","Mysuru","Hubli","Mangaluru","Belagavi","Kalaburagi","Ballari","Vijayapura","Shivamogga","Tumkur","Davanagere","Bidar","Raichur","Hassan","Hospet","Udupi","Chitradurga","Bhadravati","Mandya","Chikmagalur","Dharwad","Bagalkot","Gadag","Haveri","Koppal","Yadgir","Chamarajanagar","Kodagu","Chikkaballapur","Kolar","Ramnagara","Bengaluru Rural","Tumkur","Nelamangala","Doddaballapur","Devanahalli","Hoskote","Malur","Mulbagal","Robertsonpet","Kolar Gold Fields","Srinivaspur","Bangarpet","Gudibanda","Sidlaghatta","Chintamani","Gauribidanur","Madhugiri","Sira","Pavagada","Koratagere","Tiptur","Turuvekere","Kunigal","Gubbi","Korategere","Srirangapatna","Malavalli","Maddur","Nagamangala","Krishnarajapete","Pandavapura","Channapatna","Ramanagara","Kanakapura","Magadi","Savandurga","Anekal","Sarjapur","Attibele","Hullahalli","Nanjangud","Gundlupet","Kollegal","T Narsipur","Hunsur","Periyapatna","Kushalnagar","Virajpet","Madikeri","Somwarpet","Piriyapatna"],
  "Kerala":["Thiruvananthapuram","Kochi","Kozhikode","Kollam","Thrissur","Palakkad","Alappuzha","Malappuram","Kannur","Kasaragod","Manjeri","Thalassery","Kottayam","Ernakulam","Changanacherry","Punalur","Kayamkulam","Attingal","Varkala","Neyyattinkara","Nedumangad","Pathanamthitta","Adoor","Tiruvalla","Ranni","Pandalam","Thiruvalla","Maramon","Kozhencherry","Konni","Aranmula","Chengannur","Mavelikkara","Haripad","Mavelikara","Ambalappuzha","Cherthala","Kuttanad","Vaikom","Ettumanoor","Pala","Thodupuzha","Idukki","Munnar","Devikulam","Peermade","Adimali","Kothamangalam","Perumbavoor","Aluva","Angamaly","Chalakudy","Kodungallur","Irinjalakuda","Thrissur","Guruvayur","Kunnamkulam","Chavakkad","Kodakara","Thrissur","Palakkad","Ottappalam","Shoranur","Shornur","Mannarkkad","Perinthalmanna","Tirur","Tirurrangadi","Kottakkal","Ponnani","Tanur","Parappanangadi","Valanchery","Kondotty","Malappuram","Manjeri","Nilambur","Wandoor","Vadakara","Vatakara","Quilandy","Feroke","Koyilandy","Koduvally","Perambra","Thamarassery","Mukkam","Ramanattukara","Kozhikode","Kannur","Thalassery","Iritty","Mattannur","Kuthuparamba","Sreekandapuram","Payyanur","Nileshwaram","Kasaragod","Kanhangad","Bekal","Hosdurg","Manjeswaram"],
  "Madhya Pradesh":["Indore","Bhopal","Jabalpur","Gwalior","Ujjain","Sagar","Ratlam","Satna","Singrauli","Rewa","Burhanpur","Khandwa","Bhind","Chhindwara","Guna","Shivpuri","Vidisha","Damoh","Mandsaur","Khargone","Neemuch","Dewas","Hoshangabad","Itarsi","Sehore","Seoni","Balaghat","Narsinghpur","Panna","Chhatarpur","Tikamgarh","Sagar","Nowgong","Shahganj","Banda","Khajuraho","Maihar","Amarpatan","Nagod","Chitrakoot","Satna","Rewa","Shahdol","Anuppur","Umaria","Katni","Murwara","Sihora","Barela","Mandla","Dindori","Balaghat","Seoni","Nainpur","Waraseoni","Baihar","Lakhnadon","Gadarwara","Narsinghpur","Tewar","Jabalpur","Kymore","Maihar","Birsinghpur","Deori","Damoh","Hatta","Jabera","Patharia","Rahatgarh","Khurai","Sagar","Banda","Charkhari","Rajgarh","Biaora","Berasia","Obedullahganj","Mandideep","Sanchi","Vidisha"],
  "Maharashtra":["Mumbai","Pune","Nagpur","Thane","Nashik","Aurangabad","Solapur","Amravati","Kolhapur","Navi Mumbai","Akola","Latur","Dhule","Ahmednagar","Chandrapur","Parbhani","Jalgaon","Bhiwandi","Malegaon","Nanded","Sangli","Satara","Ratnagiri","Vasai-Virar","Kalyan","Ulhasnagar","Panvel","Yavatmal","Osmanabad","Wardha","Washim","Buldana","Hingoli","Jalna","Beed","Nandurbar","Gondia","Gadchiroli","Sindhudurg","Raigad","Alibag","Pen","Uran","Khopoli","Roha","Mangaon","Mahad","Poladpur","Shrivardhan","Murud","Chaul","Karjat","Khalapur","Pali","Sudhagad","Nagothane","Tala","Mhasla","Shriwardhan","Dapoli","Chiplun","Sangameshwar","Rajapur","Devgad","Malvan","Kudal","Vengurla","Dodamarg","Sawantwadi","Shiroda","Banda","Kankavli","Oras","Vaibhavwadi"],
  "Manipur":["Imphal","Thoubal","Kakching","Churachandpur","Bishnupur","Senapati","Moreh","Ukhrul","Chandel","Jiribam","Tamenglong","Noney","Kangpokpi","Pherzawl","Tengnoupal","Kamjong"],
  "Meghalaya":["Shillong","Tura","Jowai","Nongstoin","Baghmara","Williamnagar","Resubelpara","Mawkyrwat","Mairang","Nongpoh","Ri Bhoi","Cherrapunjee","Mawsynram","Dawki","Mawlai","Laban","Lawsohtun","Nongthymmai","Nongkynmaw","Umiam"],
  "Mizoram":["Aizawl","Lunglei","Saiha","Champhai","Serchhip","Kolasib","Lawngtlai","Mamit","Siaha","Khawzawl","Hnahthial","Saitual"],
  "Nagaland":["Kohima","Dimapur","Mokokchung","Tuensang","Wokha","Zunheboto","Phek","Mon","Longleng","Peren","Kiphire","Noklak"],
  "Odisha":["Bhubaneswar","Cuttack","Rourkela","Brahmapur","Sambalpur","Puri","Balasore","Bhadrak","Baripada","Jharsuguda","Balangir","Angul","Dhenkanal","Paradip","Bargarh","Sundargarh","Kendujhar","Rayagada","Koraput","Nabarangpur","Malkangiri","Nuapada","Sonepur","Baudh","Nayagarh","Khordha","Jagatsinghpur","Kendrapara","Jajpur","Mayurbhanj","Keonjhar","Phulbani","Berhampur","Jeypore","Nabarangapur","Phulbani","Bolangir","Titilagarh","Bhawanipatna","Kalahandi","Dharmagarh","Junagarh","Kesinga","Muniguda","Umerkote","Malkangiri","Chitrakonda","Nowrangapur","Umarkote","Kotpad","Jaypur","Similiguda","Damanjodi","Sunabeda","Vizianagaram","Borigumma","Nandapur","Mathili","Pottangi","Rayagada","Gunupur","Bissam Cuttack","Padampur","Titlagarh","Tusura","Muribahal","Belpara","Kantabanji","Patnagarh","Loisingha"],
  "Punjab":["Ludhiana","Amritsar","Jalandhar","Patiala","Bathinda","Hoshiarpur","Batala","Pathankot","Moga","Abohar","Malerkotla","Khanna","Phagwara","Muktsar","Barnala","Rajpura","Firozpur","Kapurthala","Faridkot","Fazilka","Gurdaspur","Nawanshahr","Ropar","Sangrur","Mansa","Tarn Taran","Mohali","Zirakpur","Kharar","Derabassi","Morinda","Fatehgarh Sahib","Sirhind","Nabha","Patiala","Sangrur","Sunam","Moonak","Dhuri","Lehragaga","Longowal","Malerkotla","Amargarh","Ahmedgarh","Raikot","Jagraon","Samrala","Machhiwara","Doraha","Khanna","Fatehgarh Churian","Batala","Dera Baba Nanak","Qadian","Gurdaspur","Pathankot","Dinanagar","Sujanpur","Mukerian","Dasuya","Garhdiwala","Phagwara","Nawanshahr","Rahon","Balachaur","Garhshankar","Anandpur Sahib","Nangal","Rupnagar"],
  "Rajasthan":["Jaipur","Jodhpur","Kota","Bikaner","Ajmer","Udaipur","Bhilwara","Alwar","Bharatpur","Sikar","Pali","Sri Ganganagar","Kishangarh","Tonk","Churu","Beawar","Hanumangarh","Sawai Madhopur","Chittorgarh","Nagaur","Barmer","Jhunjhunu","Banswara","Bundi","Dhaulpur","Dungarpur","Jalore","Sirohi","Rajsamand","Pratapgarh","Karauli","Dausa","Dholpur","Barmer","Balotra","Pachpadra","Gudamalani","Siwana","Chauhtan","Sindari","Baytu","Sheo","Ramsar","Chohtan","Dhorimanna","Samdari","Jasol","Pipar","Bilara","Nokha","Kolayat","Khajuwala","Lunkaransar","Sridungargarh","Ratangarh","Sujangarh","Sardarshahar","Rajgarh","Taranagar","Sadulpur","Nohar","Rawatsar","Pilibanga","Sangaria","Tibi","Karanpur","Raisinghnagar","Padampur","Anupgarh","Gharsana"],
  "Sikkim":["Gangtok","Namchi","Gyalshing","Mangan","Rangpo","Singtam","Jorethang","Ravangla","Yuksom","Pelling","Lachen","Lachung","Chungthang","Rongli","Pakyong"],
  "Tamil Nadu":["Chennai","Coimbatore","Madurai","Tiruchirappalli","Salem","Tirunelveli","Tiruppur","Vellore","Erode","Thoothukkudi","Thanjavur","Dindigul","Ranipet","Sivakasi","Karur","Ooty","Hosur","Nagercoil","Kanchipuram","Kumbakonam","Tiruvallur","Tiruvannamalai","Pollachi","Rajapalayam","Cuddalore","Nagapattinam","Villupuram","Pudukottai","Virudhunagar","Tenkasi","Ramanathapuram","Sivaganga","Ariyalur","Perambalur","Namakkal","Nilgiris","Krishnagiri","Dharmapuri","Thiruvarur","Mayiladuthurai","Kallakurichi","Chengalpattu","Tirupattur","Ranipet","Vellore","Ambur","Vaniyambadi","Gudiyatham","Arani","Arcot","Cheyyar","Tiruvannamalai","Polur","Arni","Vandavasi","Gingee","Tindivanam","Ulundurpet","Sankarapuram","Kallakurichi","Chinnasalem","Attur","Mettur","Edappadi","Valapady","Omalur","Rasipuram","Tiruchengode","Kumarapalayam","Velur","Namakkal","Paramathi","Pallipalayam","Erode","Bhavani","Gobichettipalayam","Anthiyur","Modakkurichi","Avinashi","Tirupur","Palladam","Dharapuram","Kangayam","Udumalpet","Pollachi","Valparai","Coimbatore","Anamalai","Mettupalayam","Gudalur","Coonoor","Udhagamandalam","Kotagiri","Dindigul","Palani","Oddanchatram","Vedasandur","Nilakottai","Natham","Batlagundu","Kodaikanal","Bodinayakanur","Theni","Periyakulam","Uthamapalayam","Madurai","Melur","Tirumangalam","Usilampatti","Vadipatti","Sivagangai","Karaikudi","Devakottai","Ilayangudi","Manamadurai","Virudhunagar","Rajapalayam","Aruppukkottai","Sivakasi","Sattur","Watrap","Kovilpatti","Tirunelveli","Ambasamudram","Palayankottai","Tenkasi","Alangulam","Kadayanallur","Shencottah","Sankarankovil","Cheranmahadevi","Nanguneri","Radhapuram","Valliyur","Nagercoil","Padmanabhapuram","Marthandam","Colachel","Thuckalay","Kulasekharapuram","Eraniel","Kanyakumari"],
  "Telangana":["Hyderabad","Warangal","Nizamabad","Khammam","Karimnagar","Ramagundam","Mahabubnagar","Nalgonda","Adilabad","Suryapet","Miryalaguda","Siddipet","Mancherial","Jagtial","Bhongir","Kothagudem","Bodhan","Sangareddy","Zahirabad","Wanaparthy","Jangaon","Bhadrachalam","Nirmal","Metpally","Nagarkurnool","Vikarabad","Medak","Kamareddy","Tandur","Shadnagar","Gadwal","Narayanpet","Achampet","Nagarkurnool","Kollapur","Kalwakurthy","Alampur","Mahbubnagar","Jadcherla","Kosgi","Makthal","Kodangal","Farooqnagar","Tandur","Vikarabad","Parigi","Nawabpet","Shabad","Chevella","Moinabad","Rajendranagar","Ibrahimpatnam","Hayathnagar","Ghatkesar","Keesara","Alwal","Kompally","Quthbullapur","Medchal","Shamirpet","Narsapur","Toopran","Papannapet","Ramayampet","Zaheerabad","Narayankhed","Shivampet","Andol","Shankarampet","Gummadidala","Sadasivapet","Kohir","Jogipet","Nyalkal","Banswada","Yellareddy","Armur","Bodhan","Nizamabad","Nandipeta","Balkonda","Koratla","Jagtial","Raikal","Bheemgal","Metpally","Karimnagar","Sircilla","Vemulawada","Huzurabad","Manthani","Ramagundam","Mancherial","Bellampalle","Chennur","Luxettipet","Sirpur","Adilabad","Nirmal","Bhainsa","Khanapur","Jainath","Utnoor","Ichoda","Boath","Dilawarpur","Mudhole","Bazarhatnoor","Wankidi","Asifabad","Kaghaznagar","Sirpur Kagaznagar","Mandamarri","Bhupathipalem","Bhadrachalam","Palvancha","Yellandu","Sathupally","Khammam","Kothagudem","Manuguru","Bhadrachalam","Aswapuram","Julurpad","Suryapeta","Kodad","Huzurnagar","Nalgonda","Miryalaguda","Nakrekal","Tirumalapur","Devarakonda","Bhongir","Yadagirigutta","Alair","Ramannapet","Neredcharla","Mothkur","Chandur"],
  "Tripura":["Agartala","Dharmanagar","Udaipur","Kailasahar","Belonia","Khowai","Ambassa","Bishalgarh","Sabroom","Melaghar","Kamalpur","Amarpur","Sonamura","Kumarghat","Panisagar","Longtharai Valley","Dhalai","Sepahijala","Gomati","Unakoti"],
  "Uttar Pradesh":["Lucknow","Kanpur","Ghaziabad","Agra","Meerut","Varanasi","Prayagraj","Bareilly","Aligarh","Moradabad","Saharanpur","Gorakhpur","Noida","Firozabad","Jhansi","Muzaffarnagar","Mathura","Shahjahanpur","Rampur","Etawah","Farrukhabad","Hapur","Mirzapur","Bulandshahr","Hardoi","Fatehpur","Rae Bareli","Sitapur","Bahraich","Jaunpur","Lakhimpur","Hathras","Banda","Gonda","Mainpuri","Deoria","Azamgarh","Ballia","Sultanpur","Unnao","Bijnor","Amroha","Sambhal","Badaun","Pilibhit","Kasganj","Etah","Auraiya","Kannauj","Orai","Lalitpur","Hamirpur","Mahoba","Chitrakoot","Kushinagar","Maharajganj","Siddharth Nagar","Basti","Sant Kabir Nagar","Ambedkar Nagar","Amethi","Raebareli","Barabanki","Faizabad","Ayodhya","Shravasti","Balrampur","Gonda","Lakhimpur Kheri","Pilibhit","Shahjahanpur","Hardoi","Unnao","Lucknow","Barabanki","Sitapur","Kanpur Dehat","Kanpur Nagar","Fatehpur","Kaushambi","Allahabad","Pratapgarh","Mirzapur","Sonbhadra","Chandauli","Ghazipur","Mau","Ballia","Deoria","Gorakhpur","Maharajganj","Kushinagar","Siddharth Nagar","Basti","Sant Kabir Nagar","Ambedkar Nagar","Faizabad","Sultanpur","Jaunpur","Varanasi","Sant Ravidas Nagar","Bhadohi","Azamgarh","Mau","Ballia","Ghazipur","Jaunpur","Varanasi"],
  "Uttarakhand":["Dehradun","Haridwar","Roorkee","Haldwani","Rudrapur","Kashipur","Rishikesh","Kotdwar","Ramnagar","Pithoragarh","Almora","Nainital","Mussoorie","Tehri","Uttarkashi","Chamoli","Gopeshwar","Joshimath","Badrinath","Kedarnath","Gangotri","Yamunotri","Lansdowne","Pauri","Srinagar Garhwal","Rudraprayag","Karnaprayag","Nandprayag","Vishnuprayag","Devprayag","Rishikesh","Haridwar","Roorkee","Manglaur","Laksar","Jwalapur","Kichha","Sitarganj","Gadarpur","Jaspur","Bazpur","Dineshpur","Bilaspur","Reengus","Haldwani","Lalkuan","Bhimtal","Bhowali","Ramgarh","Ranikhet","Chaubattia","Mukteshwar","Binsar","Bageshwar","Kapkot","Thal","Munsiyari","Dharchula","Champawat","Lohaghat","Tanakpur","Banbasa"],
  "West Bengal":["Kolkata","Asansol","Siliguri","Durgapur","Bardhaman","Malda","Baharampur","Habra","Kharagpur","Shantipur","Ranaghat","Haldia","Raiganj","Krishnanagar","Nabadwip","Medinipur","Jalpaiguri","Balurghat","Basirhat","Bankura","Darjeeling","Alipurduar","Purulia","Jangipur","Cooch Behar","Domjur","Uluberia","Bally","Howrah","Serampore","Chandannagar","Rishra","Hooghly","Arambagh","Goghat","Khanakul","Tarakeswar","Haripal","Dhaniakhali","Balagarh","Polba","Pursurah","Polba Dadpur","Pandua","Singur","Champdani","Baidyabati","Konnagar","Uttarpara","Jirat","Jangipara","Kalyani","Chakdah","Birnagar","Gayespur","Haringhata","Bagula","Tehatta","Chapra","Karimpur","Murshidabad","Jiaganj","Azimganj","Berhampore","Lalgola","Suti","Farakka","Manikchak","Kaliachak","Ratua","Harishchandrapur","Chanchal","Gazole","Bamangola","Habibpur","Old Malda","English Bazar","Maldah","Islampur","Raiganj","Hemtabad","Karandighi","Itahar","Dalkhola","Kaliyaganj","Kushmandi","Gangarampur","Tapan","Buniadpur","Balurghat","Hili","Cooch Behar","Dinhata","Tufanganj","Sitai","Sitalkuchi","Mathabhanga","Mekhliganj","Haldibari","Jalpaiguri","Dhupguri","Mal","Rajganj","Mainaguri","Alipurduar","Kumargram","Falakata","Madarihat"],
  "Andaman and Nicobar Islands":["Port Blair","Diglipur","Rangat","Mayabunder","Campbell Bay","Hut Bay","Car Nicobar","Kamorta","Nancowry","Katchal"],
  "Chandigarh":["Chandigarh","Manimajra","Panchkula","Mohali","Zirakpur","Kharar","Derabassi"],
  "Dadra and Nagar Haveli and Daman and Diu":["Daman","Diu","Silvassa","Amli","Khanvel","Dadra"],
  "Delhi":["New Delhi","Dwarka","Rohini","Saket","Lajpat Nagar","Karol Bagh","Connaught Place","Janakpuri","Pitampura","Vasant Kunj","Mayur Vihar","Shahdara","Preet Vihar","Narela","Bawana","Kirari","Mundka","Rajouri Garden","Patel Nagar","Punjabi Bagh","Paschim Vihar","Uttam Nagar","Bindapur","Vikaspuri","Tilak Nagar","Subhash Nagar","Tagore Garden","Moti Nagar","Kirti Nagar","Ramesh Nagar","Rajinder Nagar","Pusa","Jhandewalan","Paharganj","Sadar Bazar","Civil Lines","Kashmere Gate","Dilshad Garden","Vivek Vihar","Seema Puri","Nand Nagri","Bhajanpura","Seelampur","Welcome","Jaffrabad","Maujpur","Karawal Nagar","Mustafabad","Rohini","Pitampura","Shalimar Bagh","Ashok Vihar","Wazirpur","Model Town","Mukherjee Nagar","GTB Nagar","Adarsh Nagar","Azadpur","Jahangirpuri","Mangolpuri","Sultanpuri","Mundka","Nangloi","Najafgarh","Dwarka","Palam","Mahipalpur","Rangpuri","Vasant Vihar","Munirka","RK Puram","Sarojini Nagar","Safdarjung"],
  "Jammu and Kashmir":["Srinagar","Jammu","Anantnag","Baramulla","Sopore","Bijbehara","Udhampur","Kathua","Punch","Rajouri","Doda","Kishtwar","Reasi","Ramban","Banihal","Qazigund","Kulgam","Shopian","Pulwama","Budgam","Ganderbal","Bandipora","Gurez","Kargil","Drass","Padum","Leh"],
  "Ladakh":["Leh","Kargil","Nubra","Zanskar","Diskit","Sumur","Panamik","Turtuk","Nyoma","Hanle","Durbuk","Chushul","Demchok","Padum","Zangla","Rangdum"],
  "Lakshadweep":["Kavaratti","Agatti","Amini","Andrott","Minicoy","Kalpeni","Kiltan","Chetlat","Bitra","Bangaram"],
  "Puducherry":["Puducherry","Karaikal","Mahe","Yanam","Oulgaret","Villianur","Ariyankuppam","Nettapakkam","Mannadipet","Bahour"],
};

const SHIPPING_DEFAULTS = {
  standardFee: 99, expressFee: 149,
  freeAbove: 999, enableFreeShipping: true, enableExpress: true,
  standardDays: "5–7", expressDays: "2–3",
};

const TAX_DEFAULTS = { enabled: false, label: "GST", rate: 18, inclusive: true };

export default function CheckoutPage({cart, setPage, setCart, setLastOrder, user}) {
  const [ship, setShip]           = useState("standard");
  const [addr, setAddr]           = useState({name: user?.name || "", email: user?.email || "", phone:"", line1:"", city:"", state:"", pin:""});
  const [placing, setPlacing]     = useState(false);
  const [pinLookup, setPinLookup] = useState({ loading: false, error: "" });
  const [cityDraft,  setCityDraft]  = useState({ active: false, val: "" });

  const handlePinChange = async (pin) => {
    // Clear stale city/state the moment a new 6-digit pin is entered
    setAddr(prev => ({ ...prev, pin, ...(pin.length === 6 ? { city: "", state: "" } : {}) }));
    if (pin.length !== 6) { setPinLookup({ loading: false, error: "" }); return; }
    setPinLookup({ loading: true, error: "" });
    // Try India Post API first
    try {
      const r1   = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const d1   = await r1.json();
      if (d1[0]?.Status === "Success" && d1[0].PostOffice?.length > 0) {
        const po = d1[0].PostOffice[0];
        setAddr(prev => ({ ...prev, city: po.District || po.Name || "", state: po.State || "" }));
        setPinLookup({ loading: false, error: "" });
        return;
      }
    } catch { /* fall through to next API */ }

    // Fallback: OpenStreetMap Nominatim
    try {
      const r2   = await fetch(
        `https://nominatim.openstreetmap.org/search?postalcode=${pin}&country=india&format=json&addressdetails=1&limit=1`
      );
      const d2   = await r2.json();
      if (d2.length > 0 && d2[0].address) {
        const a     = d2[0].address;
        const state = a.state || "";
        const city  = a.city_district || a.county || a.city || a.town || a.village || "";
        if (state) {
          setAddr(prev => ({ ...prev, state, city: city || "" }));
          setPinLookup({ loading: false, error: "" });
          return;
        }
      }
    } catch { /* fall through */ }

    // Both unavailable – leave fields empty for manual entry
    setPinLookup({ loading: false, error: "" });
  };

  const handleCityChange = async (city) => {
    setAddr(prev => ({ ...prev, city, pin: "" }));
    setPinLookup({ loading: false, error: "" });
    // Only do reverse lookup when city matches a known entry (selected from datalist)
    if (!city || !addr.state || !(CITIES_BY_STATE[addr.state] || []).includes(city)) return;
    setPinLookup({ loading: true, error: "" });
    try {
      const r1 = await fetch(`https://api.postalpincode.in/postoffice/${encodeURIComponent(city)}`);
      const d1 = await r1.json();
      if (d1[0]?.Status === "Success" && d1[0].PostOffice?.length > 0) {
        const po = d1[0].PostOffice.find(p => p.State === addr.state) || d1[0].PostOffice[0];
        if (/^\d{6}$/.test(po?.Pincode)) {
          setAddr(prev => ({ ...prev, pin: po.Pincode }));
          setPinLookup({ loading: false, error: "" });
          return;
        }
      }
    } catch { }
    try {
      const r2 = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city + ", " + addr.state + ", India")}&format=json&addressdetails=1&limit=1`
      );
      const d2 = await r2.json();
      if (d2[0]?.address?.postcode) {
        const pin = d2[0].address.postcode.replace(/\D/g, "").slice(0, 6);
        if (pin.length === 6) { setAddr(prev => ({ ...prev, pin })); setPinLookup({ loading: false, error: "" }); return; }
      }
    } catch { }
    setPinLookup({ loading: false, error: "" });
  };

  const [cfg, setCfg]             = useState(SHIPPING_DEFAULTS);
  const [taxCfg, setTaxCfg]       = useState(TAX_DEFAULTS);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError]     = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [showAvailable, setShowAvailable] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState(null);
  const [savedAddresses, setSavedAddresses]   = useState([]);
  const [savedPayMethods, setSavedPayMethods] = useState([]);
  const [selectedAddrId, setSelectedAddrId]   = useState(null);
  const [selectedPayId, setSelectedPayId]     = useState(null);
  const [saveAddrToProfile, setSaveAddrToProfile] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWallet, setUseWallet]         = useState(false);
  const [walletError, setWalletError]     = useState("");
  const [rzpOpen, setRzpOpen]             = useState(false);
  const [rzpAmt, setRzpAmt]               = useState("");
  const [topUpOpen, setTopUpOpen]         = useState(false);
  const [rzpCheckoutOpen, setRzpCheckoutOpen] = useState(false);

  // Real-time wallet balance subscription
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeWalletBalance(user.uid, setWalletBalance);
    return unsub;
  }, [user?.uid]);

  useEffect(() => {
    Promise.all([
      getDoc(doc(db, "settings", "shipping")),
      getDoc(doc(db, "settings", "tax")),
    ]).then(([shipSnap, taxSnap]) => {
      if (shipSnap.exists()) setCfg(prev => ({ ...prev, ...shipSnap.data() }));
      if (taxSnap.exists())  setTaxCfg(prev => ({ ...prev, ...taxSnap.data() }));
    });
  }, []);

  // Load saved addresses + payment methods for logged-in users
  useEffect(() => {
    if (!user?.uid) return;
    getDoc(doc(db, "users", user.uid)).then(snap => {
      if (!snap.exists()) return;
      const data = snap.data();
      const addrs = data.addresses || [];
      const pays  = data.paymentMethods || [];
      setSavedAddresses(addrs);
      setSavedPayMethods(pays);
      // Pre-fill with default (or first) address
      const def = addrs.find(a => a.isDefault) || addrs[0];
      if (def) {
        setSelectedAddrId(def.id);
        setAddr(a => ({
          ...a,
          name:  def.name  || a.name,
          email: def.email || a.email,
          phone: def.phone || a.phone,
          line1: def.line1 || a.line1,
          city:  def.city  || a.city,
          state: def.state || a.state,
          pin:   def.pin   || a.pin,
        }));
      }
      // Pre-select default payment method
      const defPay = pays.find(p => p.isDefault) || pays[0];
      if (defPay) setSelectedPayId(defPay.id);
    }).catch(() => {});
  }, [user?.uid]); // eslint-disable-line

  const pickAddress = (a) => {
    setSelectedAddrId(a.id);
    setAddr(prev => ({
      ...prev,
      name: a.name || prev.name,
      email: a.email || prev.email,
      phone: a.phone || prev.phone,
      line1: a.line1,
      city:  a.city,
      state: a.state,
      pin:   a.pin,
    }));
  };

  const subtotal    = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const isFree      = cfg.enableFreeShipping && subtotal >= cfg.freeAbove;
  const shippingFee = ship === "express" ? cfg.expressFee : (isFree ? 0 : cfg.standardFee);
  const discount    = calcDiscount(appliedCoupon, subtotal);
  const taxableAmt  = subtotal - discount;
  const taxAmount   = taxCfg.enabled && !taxCfg.inclusive
    ? Math.round(taxableAmt * taxCfg.rate / 100)
    : 0;
  const inclusiveTax = taxCfg.enabled && taxCfg.inclusive
    ? Math.round(taxableAmt * taxCfg.rate / (100 + taxCfg.rate))
    : 0;
  const total       = taxableAmt + shippingFee + taxAmount;
  const walletApplied = useWallet ? Math.min(walletBalance, total) : 0;
  const amountToPay   = total - walletApplied;

  const handleApplyCoupon = async () => {
    setCouponLoading(true);
    setCouponError("");
    setAppliedCoupon(null);
    const result = await validateCoupon(couponInput, subtotal);
    if (result.valid) {
      setAppliedCoupon(result.coupon);
      setCouponError("");
    } else {
      setCouponError(result.error);
    }
    setCouponLoading(false);
  };

  const removeCoupon = () => { setAppliedCoupon(null); setCouponInput(""); setCouponError(""); };

  const toggleAvailable = async () => {
    if (showAvailable) { setShowAvailable(false); return; }
    if (!availableCoupons) {
      const list = await getPublicCoupons(subtotal);
      setAvailableCoupons(list);
    }
    setShowAvailable(true);
  };

  const quickApply = async (code) => {
    setShowAvailable(false);
    setCouponInput(code);
    setCouponLoading(true);
    setCouponError("");
    setAppliedCoupon(null);
    const result = await validateCoupon(code, subtotal);
    if (result.valid) setAppliedCoupon(result.coupon);
    else setCouponError(result.error);
    setCouponLoading(false);
  };

  const placeOrder = async e => {
    e.preventDefault();
    setWalletError("");

    // Open Razorpay if there's an amount to pay externally
    if (amountToPay > 0) {
      setRzpCheckoutOpen(true);
      return;
    }

    // Full wallet payment — debit wallet then create order
    setPlacing(true);
    if (walletApplied > 0 && user?.uid) {
      try {
        const orderId = "TS" + Date.now().toString().slice(-6);
        await debitWallet(user.uid, walletApplied,
          `Payment for order #${orderId}`,
          { source: "checkout", orderId }
        );
        await _finishPlaceOrder(orderId, null);
      } catch (err) {
        setWalletError(err.message || "Wallet payment failed. Please try again.");
        setPlacing(false);
      }
      return;
    }
    await _finishPlaceOrder(null, null);
  };

  const handleRzpSuccess = async (paymentId) => {
    setRzpCheckoutOpen(false);
    setPlacing(true);
    if (walletApplied > 0 && user?.uid) {
      try {
        const orderId = "TS" + Date.now().toString().slice(-6);
        await debitWallet(user.uid, walletApplied,
          `Payment for order #${orderId}`,
          { source: "checkout", orderId }
        );
        await _finishPlaceOrder(orderId, paymentId);
      } catch (err) {
        setWalletError(err.message || "Wallet payment failed. Please try again.");
        setPlacing(false);
      }
      return;
    }
    await _finishPlaceOrder(null, paymentId);
  };

  const _finishPlaceOrder = async (presetOrderId, paymentId = null) => {
    // Save new address to profile if requested
    if (saveAddrToProfile && user?.uid && !selectedAddrId) {
      const newId = Date.now().toString(36);
      const newAddr = { ...addr, id: newId, label: "Other", isDefault: savedAddresses.length === 0 };
      const updated = savedAddresses.length === 0
        ? [{ ...newAddr, isDefault: true }]
        : [...savedAddresses, newAddr];
      updateDoc(doc(db, "users", user.uid), { addresses: updated }).catch(() => {});
    }

    const selPay  = savedPayMethods.find(p => p.id === selectedPayId);
    const orderId = presetOrderId || ("TS" + Date.now().toString().slice(-6));

    // Collect device + IP fingerprint silently (no user prompt)
    const deviceInfo = await collectDeviceFingerprint().catch(() => null);

    const orderData = {
      id: orderId,
      items: cart.map(i => ({
        id: i.id, name: i.name, images: i.images || [],
        price: i.price, qty: i.qty,
        selSize: i.selSize || null, selColor: i.selColor || null,
      })),
      total, addr, ship,
      userId: user?.uid || null,
      userEmail: addr.email || user?.email || null,
      coupon: appliedCoupon ? { code: appliedCoupon.code, discount } : null,
      tax: taxCfg.enabled ? { label: taxCfg.label, rate: taxCfg.rate, inclusive: taxCfg.inclusive, amount: taxCfg.inclusive ? inclusiveTax : taxAmount } : null,
      preferredPayment: selPay ? { type: selPay.type, label: selPay.label, upiId: selPay.upiId || "" } : null,
      walletApplied:      walletApplied || null,
      amountToPay:        walletApplied > 0 ? amountToPay : null,
      razorpayPaymentId:  paymentId || null,
      paymentStatus:      paymentId ? "paid" : (amountToPay === 0 && walletApplied > 0 ? "wallet" : "cod"),
      _device: deviceInfo,   // stored for admin security / fraud review only
    };
    await createOrder(orderData);
    if (appliedCoupon) await applyCouponUsage(appliedCoupon.docId);
    notifyOrderPlaced(orderData);
    setLastOrder({ ...orderData, docId: orderId });
    setCart([]);
    setPage("success", { replace: true });
    setPlacing(false);
  };

  if (cart.length === 0) return (
    <div style={{textAlign:"center",padding:"80px 20px"}}>
      <div style={{fontSize:"3rem",marginBottom:16}}>🛒</div>
      <p style={{color:"var(--mt)",marginBottom:20}}>Your cart is empty.</p>
      <button className="btn-sf" onClick={() => setPage("shop")}>Continue Shopping</button>
    </div>
  );

  const shipOptions = [
    { id:"standard", name:"Standard Delivery", det:`${cfg.standardDays} business days`, price: isFree ? "Free" : fmt(cfg.standardFee) },
    ...(cfg.enableExpress ? [{ id:"express", name:"Express Delivery", det:`${cfg.expressDays} business days`, price: fmt(cfg.expressFee) }] : []),
  ];

  const stepBadge = {
    width:26, height:26, borderRadius:"50%",
    background:"linear-gradient(135deg,#0F1E4A,#1565C0)",
    color:"#fff", fontWeight:800, fontSize:".8rem",
    display:"flex", alignItems:"center", justifyContent:"center",
    flexShrink:0, boxShadow:"0 2px 8px rgba(21,101,192,.25)",
  };

  return (
    <>
    <div className="ck-wrap">
      <button className="pd-back" onClick={() => setPage("shop")}>← Continue Shopping</button>
      <h2 style={{fontFamily:"Cormorant Garamond,serif",fontSize:"1.8rem",fontWeight:700,marginBottom:28}}>Checkout</h2>
      <form onSubmit={placeOrder}>
        <div className="ck-grid">
          <div className="ck-form">

            {/* ── Step 1 · Delivery Address ── */}
            <div className="ck-section">
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
                <div style={stepBadge}>1</div>
                <h3 style={{margin:0,fontFamily:"Cormorant Garamond,serif",fontSize:"1.1rem",fontWeight:700,color:"var(--dk)"}}>Delivery Address</h3>
              </div>

              {savedAddresses.length > 0 && (
                <>
                  <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:12}}>
                    {savedAddresses.map(a => {
                      const icon = {Home:"🏠",Work:"💼",Other:"📍"}[a.label]||"📍";
                      const active = selectedAddrId === a.id;
                      return (
                        <div key={a.id} onClick={() => pickAddress(a)}
                          style={{cursor:"pointer",border:`2px solid ${active?"var(--sf)":"var(--bd)"}`,
                            borderRadius:12,padding:"12px 16px",background:active?"#FFF8F3":"#fff",
                            flex:"0 0 auto",minWidth:160,maxWidth:210,transition:"all .15s",
                            boxShadow:active?"0 2px 12px rgba(232,98,10,.15)":"none"}}>
                          <div style={{fontWeight:700,fontSize:".82rem",marginBottom:3,display:"flex",alignItems:"center",gap:6}}>
                            {icon} {a.label}
                            {a.isDefault&&<span style={{fontSize:".65rem",background:"var(--sf)",color:"#fff",padding:"1px 7px",borderRadius:8,fontWeight:700}}>Default</span>}
                          </div>
                          <div style={{fontSize:".8rem",color:"var(--dk)",fontWeight:600}}>{a.name}</div>
                          <div style={{fontSize:".76rem",color:"var(--mt)",marginTop:2}}>{a.city}, {a.state}</div>
                          <div style={{fontSize:".74rem",color:"var(--mt)"}}>{a.pin}</div>
                          {active&&<div style={{fontSize:".72rem",color:"var(--sf)",fontWeight:700,marginTop:4}}>✓ Selected</div>}
                        </div>
                      );
                    })}
                    <div onClick={()=>{setSelectedAddrId(null);setAddr({name:user?.name||"",email:user?.email||"",phone:"",line1:"",city:"",state:"",pin:""});}}
                      style={{cursor:"pointer",border:`2px dashed ${!selectedAddrId?"var(--sf)":"var(--bd)"}`,
                        borderRadius:12,padding:"12px 16px",background:!selectedAddrId?"#FFF8F3":"#fff",
                        flex:"0 0 auto",minWidth:130,display:"flex",flexDirection:"column",
                        alignItems:"center",justifyContent:"center",gap:4,color:"var(--mt)",transition:"all .15s"}}>
                      <span style={{fontSize:"1.4rem"}}>+</span>
                      <span style={{fontSize:".78rem",fontWeight:600,textAlign:"center"}}>New address</span>
                    </div>
                  </div>
                  <div style={{fontSize:".8rem",color:"var(--mt)",marginBottom:10}}>
                    {selectedAddrId?"Fields below are pre-filled — edit if needed.":"Fill in the address below."}
                  </div>
                </>
              )}

              <div className="inp-grp"><label>Full Name *</label><input required placeholder="Full name" value={addr.name} onChange={e=>setAddr({...addr,name:e.target.value})}/></div>
              <div className="inp-grp"><label>Email *</label><input required type="email" placeholder="you@example.com" value={addr.email} onChange={e=>setAddr({...addr,email:e.target.value})}/></div>
              <div className="inp-grp"><label>Phone *</label><input required placeholder="+91 XXXXX XXXXX" value={addr.phone} onChange={e=>setAddr({...addr,phone:e.target.value})}/></div>
              <div className="inp-grp"><label>Address *</label><input required placeholder="House / Flat, Street, Area" value={addr.line1} onChange={e=>setAddr({...addr,line1:e.target.value})}/></div>

              {/* PIN → auto-detects city & state */}
              <div className="inp-grp">
                <label>PIN Code *
                  {pinLookup.loading && <span style={{marginLeft:8,fontSize:".75rem",color:"#E8620A",fontWeight:400}}>Looking up…</span>}
                  {pinLookup.error  && <span style={{marginLeft:8,fontSize:".75rem",color:"#C0392B",fontWeight:400}}>{pinLookup.error}</span>}
                  {!pinLookup.loading && !pinLookup.error && addr.city && addr.state && addr.pin.length===6 &&
                    <span style={{marginLeft:8,fontSize:".75rem",color:"#2D7D46",fontWeight:400}}>✓ Auto-filled</span>}
                </label>
                <input required placeholder="6-digit PIN" maxLength={6}
                  value={addr.pin}
                  onChange={e => handlePinChange(e.target.value.replace(/\D/g,""))}
                  style={addr.pin.length===6&&!pinLookup.error?{borderColor:"#A8D5B5"}:{}}/>
              </div>

              <div className="form-row">
                {/* State dropdown */}
                <div className="inp-grp">
                  <label>State *</label>
                  <select required value={addr.state}
                    onChange={e => { setAddr({...addr, state: e.target.value, city: "", pin: ""}); setPinLookup({ loading: false, error: "" }); }}
                    style={{width:"100%",padding:"10px 12px",border:"1.5px solid var(--bd)",borderRadius:9,
                      fontSize:".92rem",fontFamily:"DM Sans,sans-serif",background:"#fff",
                      color:addr.state?"var(--dk)":"var(--mt)",outline:"none",appearance:"auto"}}>
                    <option value="">Select State</option>
                    {INDIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* City — datalist filtered by state */}
                <div className="inp-grp">
                  <label>City / Town *</label>
                  <input required list="ck-city-list" placeholder={addr.state ? "Type or select city" : "Select state first"}
                    value={cityDraft.active ? cityDraft.val : addr.city}
                    onFocus={() => setCityDraft({ active: true, val: "" })}
                    onBlur={() => setCityDraft({ active: false, val: "" })}
                    onChange={e => { setCityDraft(p => ({ ...p, val: e.target.value })); handleCityChange(e.target.value); }}
                    disabled={!addr.state}/>
                  <datalist id="ck-city-list">
                    {[...new Set(CITIES_BY_STATE[addr.state] || [])].map(c => <option key={c} value={c}/>)}
                  </datalist>
                </div>
              </div>
              {user && !selectedAddrId && (
                <label style={{display:"flex",alignItems:"center",gap:8,fontSize:".84rem",color:"var(--mt)",cursor:"pointer",marginTop:6}}>
                  <input type="checkbox" checked={saveAddrToProfile} onChange={e=>setSaveAddrToProfile(e.target.checked)}/>
                  Save this address to my profile for future checkouts
                </label>
              )}
            </div>

            {/* ── Step 2 · Shipping Method ── */}
            <div className="ck-section">
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
                <div style={stepBadge}>2</div>
                <h3 style={{margin:0,fontFamily:"Cormorant Garamond,serif",fontSize:"1.1rem",fontWeight:700,color:"var(--dk)"}}>Shipping Method</h3>
              </div>
              {isFree && (
                <div style={{background:"#E8F5EC",border:"1px solid #A8D5B5",borderRadius:8,padding:"9px 14px",fontSize:".83rem",color:"#2D7D46",fontWeight:600,marginBottom:14}}>
                  🎉 Free Standard Shipping on orders above {fmt(cfg.freeAbove)}!
                </div>
              )}
              <div className="ship-opts">
                {shipOptions.map(s => (
                  <label key={s.id} className={`ship-opt ${ship===s.id?"sel":""}`}>
                    <input type="radio" name="ship" value={s.id} checked={ship===s.id} onChange={()=>setShip(s.id)}/>
                    <div className="ship-opt-info">
                      <div className="ship-opt-name">{s.name}</div>
                      <div className="ship-opt-det">{s.det}</div>
                    </div>
                    <div className="ship-opt-price">{s.price}</div>
                  </label>
                ))}
              </div>
            </div>

            {/* ── Step 3 · Offers & Coupon ── */}
            <div className="ck-section">
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
                <div style={stepBadge}>3</div>
                <h3 style={{margin:0,fontFamily:"Cormorant Garamond,serif",fontSize:"1.1rem",fontWeight:700,color:"var(--dk)"}}>Offers & Coupon</h3>
              </div>
              {appliedCoupon ? (
                <div className="coupon-applied">
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:"1.1rem"}}>🎟️</span>
                    <div>
                      <div style={{fontWeight:700,fontSize:".92rem",color:"#2D7D46"}}>{appliedCoupon.code}</div>
                      <div style={{fontSize:".78rem",color:"#2D7D46",marginTop:2}}>
                        You save {fmt(discount)}{appliedCoupon.type==="percent"?` (${appliedCoupon.value}% off)`:""}
                      </div>
                    </div>
                  </div>
                  <button type="button" onClick={removeCoupon} className="coupon-remove">✕ Remove</button>
                </div>
              ) : (
                <div className="coupon-row">
                  <input className="coupon-input" placeholder="Enter coupon code" value={couponInput}
                    onChange={e=>{setCouponInput(e.target.value.toUpperCase());setCouponError("");}}
                    onKeyDown={e=>e.key==="Enter"&&(e.preventDefault(),handleApplyCoupon())}/>
                  <button type="button" className="admin-btn coupon-apply-btn"
                    onClick={handleApplyCoupon} disabled={couponLoading||!couponInput.trim()}>
                    {couponLoading?"…":"Apply"}
                  </button>
                </div>
              )}
              {couponError&&<div className="coupon-error">{couponError}</div>}
              {!appliedCoupon && (
                <div style={{marginTop:10}}>
                  <button type="button" onClick={toggleAvailable}
                    style={{background:"none",border:"none",cursor:"pointer",color:"#E8620A",fontSize:".83rem",fontWeight:600,padding:0,display:"flex",alignItems:"center",gap:5,fontFamily:"DM Sans,sans-serif"}}>
                    🎟️ View available coupons
                    <span style={{fontSize:".7rem",transition:"transform .2s",display:"inline-block",transform:showAvailable?"rotate(180deg)":"none"}}>▾</span>
                  </button>
                  {showAvailable && (
                    <div style={{marginTop:10,display:"flex",flexDirection:"column",gap:8}}>
                      {availableCoupons===null ? (
                        <div style={{fontSize:".82rem",color:"var(--mt)"}}>Loading…</div>
                      ) : availableCoupons.length===0 ? (
                        <div style={{fontSize:".82rem",color:"var(--mt)"}}>No coupons available right now.</div>
                      ) : availableCoupons.map(c => {
                        const eligible=!c.minOrder||subtotal>=c.minOrder;
                        const discountText=c.type==="percent"?`${c.value}% off${c.maxDiscount?` (max ₹${c.maxDiscount})`:""}`:`₹${c.value} off`;
                        return (
                          <div key={c.docId}
                            style={{border:`1.5px dashed ${eligible?"#E8620A":"#D1C5BB"}`,borderRadius:10,padding:"10px 14px",
                              background:eligible?"#FFFAF6":"#F8F4F0",
                              display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,opacity:eligible?1:0.65}}>
                            <div>
                              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                                <span style={{fontFamily:"monospace",fontWeight:800,fontSize:".92rem",letterSpacing:".06em",color:"#18100A"}}>{c.code}</span>
                                <span style={{fontSize:".73rem",fontWeight:700,color:"#E8620A"}}>{discountText}</span>
                              </div>
                              <div style={{fontSize:".75rem",color:"#6B4C38"}}>
                                {c.minOrder>0?eligible?`Min order ₹${c.minOrder} ✓`:`Min order ₹${c.minOrder} — add ₹${c.minOrder-subtotal} more`:"No minimum order"}
                              </div>
                            </div>
                            <button type="button" onClick={()=>quickApply(c.code)} disabled={!eligible}
                              style={{padding:"6px 16px",border:"none",borderRadius:8,background:eligible?"#E8620A":"#D1C5BB",
                                color:"#fff",fontWeight:700,fontSize:".8rem",cursor:eligible?"pointer":"not-allowed",
                                fontFamily:"DM Sans,sans-serif",whiteSpace:"nowrap",flexShrink:0}}>
                              Apply
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Step 4 · Payment ── */}
            <div className="ck-section">
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
                <div style={stepBadge}>4</div>
                <h3 style={{margin:0,fontFamily:"Cormorant Garamond,serif",fontSize:"1.1rem",fontWeight:700,color:"var(--dk)"}}>Payment</h3>
              </div>

              {/* Saved payment methods */}
              {savedPayMethods.length > 0 && (
                <div style={{marginBottom:16}}>
                  <div style={{fontSize:".75rem",fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",color:"#6B4C38",marginBottom:10}}>
                    Preferred Method
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {savedPayMethods.map(p => {
                      const active=selectedPayId===p.id;
                      return (
                        <label key={p.id} onClick={()=>setSelectedPayId(active?null:p.id)}
                          style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",
                            border:`1.5px solid ${active?"var(--sf)":"var(--bd)"}`,
                            borderRadius:10,background:active?"#FFF8F3":"#fff",
                            cursor:"pointer",transition:"all .15s"}}>
                          <div style={{width:20,height:20,borderRadius:"50%",border:`2px solid ${active?"var(--sf)":"var(--bd)"}`,
                            background:active?"var(--sf)":"#fff",display:"flex",alignItems:"center",justifyContent:"center",
                            flexShrink:0,transition:"all .15s"}}>
                            {active&&<div style={{width:8,height:8,borderRadius:"50%",background:"#fff"}}/>}
                          </div>
                          <span style={{fontSize:"1.1rem"}}>{p.type==="upi"?"📱":"💳"}</span>
                          <div style={{flex:1}}>
                            <div style={{fontWeight:700,fontSize:".88rem"}}>{p.label||(p.type==="upi"?"UPI":"Card")}</div>
                            <div style={{fontSize:".8rem",color:"var(--mt)",fontFamily:"monospace"}}>
                              {p.type==="upi"?p.upiId:p.cardDisplay}
                            </div>
                          </div>
                          {p.isDefault&&<span style={{fontSize:".7rem",background:"#F0E8DF",color:"var(--sf)",padding:"2px 8px",borderRadius:8,fontWeight:700}}>Default</span>}
                        </label>
                      );
                    })}
                    {selectedPayId && (
                      <button type="button" onClick={()=>setSelectedPayId(null)}
                        style={{background:"none",border:"none",cursor:"pointer",color:"var(--mt)",fontSize:".8rem",
                          textAlign:"left",padding:"4px 0",fontFamily:"DM Sans,sans-serif"}}>
                        ✕ Clear selection
                      </button>
                    )}
                  </div>
                  <div style={{fontSize:".76rem",color:"var(--mt)",marginTop:8}}>
                    Your preferred method will be shown at payment. Actual payment is processed securely.
                  </div>
                </div>
              )}

              {/* Wallet */}
              {user?.uid && (
                <div style={{borderTop:savedPayMethods.length>0?"1px solid var(--bd)":"none",paddingTop:savedPayMethods.length>0?14:0}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                    <div style={{fontWeight:700,fontSize:".88rem",color:"var(--dk)",display:"flex",alignItems:"center",gap:7}}>
                      💰 Wallet
                      {walletBalance > 0
                        ? <span style={{fontWeight:700,color:"#2D7D46",fontSize:".85rem"}}>{fmt(walletBalance)} available</span>
                        : <span style={{fontWeight:400,color:"var(--mt)",fontSize:".82rem"}}>₹0 balance</span>}
                    </div>
                    <button type="button" onClick={()=>setTopUpOpen(v=>!v)}
                      style={{background:"none",border:"1px solid var(--bd)",borderRadius:8,padding:"4px 12px",
                        cursor:"pointer",fontSize:".78rem",color:"#1565C0",fontWeight:600,fontFamily:"DM Sans,sans-serif",
                        borderColor:"#BFDBFE",background:"#EFF6FF",transition:"all .15s"}}
                      onMouseEnter={e=>{e.currentTarget.style.background="#DBEAFE";e.currentTarget.style.borderColor="#93C5FD";}}
                      onMouseLeave={e=>{e.currentTarget.style.background="#EFF6FF";e.currentTarget.style.borderColor="#BFDBFE";}}>
                      {topUpOpen?"✕ Cancel":"⚡ Top Up"}
                    </button>
                  </div>

                  {walletBalance > 0 && (
                    <div style={{background:useWallet?"#E8F5E9":"#F8F4F0",border:`1.5px solid ${useWallet?"#A8D5B5":"var(--bd)"}`,
                      borderRadius:12,padding:"12px 14px",marginBottom:topUpOpen?12:0,transition:"all .2s"}}>
                      <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}>
                        <div style={{width:20,height:20,borderRadius:5,border:`2px solid ${useWallet?"#2D7D46":"var(--bd)"}`,
                          background:useWallet?"#2D7D46":"#fff",display:"flex",alignItems:"center",justifyContent:"center",
                          flexShrink:0,transition:"all .15s"}}>
                          {useWallet&&<span style={{color:"#fff",fontSize:".78rem",lineHeight:1}}>✓</span>}
                        </div>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:700,fontSize:".88rem",color:"var(--dk)"}}>
                            Use wallet balance &nbsp;
                            <span style={{color:"#2D7D46"}}>{fmt(walletBalance)} available</span>
                          </div>
                          {useWallet && (
                            <div style={{fontSize:".78rem",color:"#2D7D46",marginTop:2,fontWeight:600}}>
                              {walletApplied>=total
                                ? "✅ Full order covered — nothing extra to pay!"
                                : `💚 ${fmt(walletApplied)} will be deducted · Pay ${fmt(amountToPay)} externally`}
                            </div>
                          )}
                        </div>
                        <input type="checkbox" checked={useWallet} onChange={e=>setUseWallet(e.target.checked)} style={{display:"none"}}/>
                      </label>
                    </div>
                  )}

                  {topUpOpen && (
                    <div style={{background:"#F8FAFC",border:"1.5px solid #BFDBFE",borderRadius:12,padding:16,marginTop:walletBalance>0?0:0}}>
                      <div style={{fontWeight:700,fontSize:".82rem",color:"#0F1E4A",marginBottom:12,display:"flex",alignItems:"center",gap:6}}>
                        🔒 Add Money via Razorpay
                      </div>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
                        {[100,250,500,1000,2000].map(a=>(
                          <button key={a} type="button" onClick={()=>setRzpAmt(String(a))}
                            style={{padding:"5px 14px",borderRadius:18,border:`1.5px solid ${rzpAmt===String(a)?"#1565C0":"var(--bd)"}`,
                              background:rzpAmt===String(a)?"#EAF2FF":"#fff",
                              color:rzpAmt===String(a)?"#1565C0":"var(--mt)",
                              fontWeight:rzpAmt===String(a)?700:400,
                              cursor:"pointer",fontSize:".8rem",fontFamily:"DM Sans,sans-serif",transition:"all .15s"}}>
                            ₹{a}
                          </button>
                        ))}
                      </div>
                      <div style={{display:"flex",gap:8,alignItems:"center"}}>
                        <div style={{position:"relative",flex:1}}>
                          <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",
                            fontWeight:700,color:"#1565C0",fontSize:".9rem"}}>₹</span>
                          <input type="number" min={10} placeholder="Amount (min ₹10)"
                            value={rzpAmt} onChange={e=>setRzpAmt(e.target.value)}
                            style={{width:"100%",padding:"9px 12px 9px 26px",border:"1.5px solid var(--bd)",borderRadius:9,
                              fontSize:".88rem",fontFamily:"DM Sans,sans-serif",outline:"none",boxSizing:"border-box"}}/>
                        </div>
                        <button type="button"
                          onClick={()=>{ if(parseFloat(rzpAmt)>=10) setRzpOpen(true); }}
                          disabled={!rzpAmt||parseFloat(rzpAmt)<10}
                          style={{padding:"9px 18px",border:"none",borderRadius:9,
                            background:!rzpAmt||parseFloat(rzpAmt)<10?"#94A3B8":"linear-gradient(135deg,#0F1E4A,#1565C0)",
                            color:"#fff",fontWeight:700,
                            cursor:!rzpAmt||parseFloat(rzpAmt)<10?"not-allowed":"pointer",
                            fontSize:".85rem",fontFamily:"DM Sans,sans-serif",whiteSpace:"nowrap",flexShrink:0}}>
                          {rzpAmt&&parseFloat(rzpAmt)>=10?`Pay ₹${parseFloat(rzpAmt).toLocaleString("en-IN")}`:"Pay Now"}
                        </button>
                      </div>
                    </div>
                  )}

                  {walletError && (
                    <div style={{marginTop:8,background:"#FDECEA",color:"#C0392B",borderRadius:8,padding:"8px 12px",fontSize:".84rem"}}>
                      ⚠️ {walletError}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Order summary */}
          <div className="ck-summary">
            <div className="ck-sum-card">
              <h3>Order Summary</h3>
              {cart.map(item => (
                <div key={item.cartId} className="ck-item">
                  <div className="ck-item-img">
                    {item.images?.[0]
                      ? <img src={item.images[0]} alt="" style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:6}}/>
                      : <NoImageIcon/>}
                  </div>
                  <div className="ck-item-info">
                    <div className="ck-item-name">{item.name}</div>
                    <div className="ck-item-opt">{[item.selSize, item.selColor].filter(Boolean).join(" · ")} · Qty {item.qty}</div>
                  </div>
                  <div className="ck-item-price">{fmt(item.price * item.qty)}</div>
                </div>
              ))}
              <hr className="ck-divider"/>
              <div className="ck-row"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
              {discount > 0 && (
                <div className="ck-row" style={{color:"#2D7D46",fontWeight:600}}>
                  <span>🎟️ Coupon ({appliedCoupon.code})</span>
                  <span>− {fmt(discount)}</span>
                </div>
              )}
              {taxAmount > 0 && (
                <div className="ck-row" style={{color:"#B7770D"}}>
                  <span>{taxCfg.label} ({taxCfg.rate}%)</span>
                  <span>+ {fmt(taxAmount)}</span>
                </div>
              )}
              <div className="ck-row"><span>Shipping</span><span>{shippingFee === 0 ? "Free" : fmt(shippingFee)}</span></div>
              <hr className="ck-divider"/>
              <div className="ck-row total"><span>Order Total</span><span>{fmt(total)}</span></div>
              {walletApplied > 0 && (
                <div className="ck-row" style={{color:"#2D7D46",fontWeight:700}}>
                  <span>💰 Wallet</span>
                  <span>− {fmt(walletApplied)}</span>
                </div>
              )}
              {walletApplied > 0 && (
                <>
                  <hr className="ck-divider"/>
                  <div className="ck-row total" style={{color: amountToPay === 0 ? "#2D7D46" : "var(--dk)"}}>
                    <span>Amount to Pay</span>
                    <span>{amountToPay === 0 ? "Free 🎉" : fmt(amountToPay)}</span>
                  </div>
                </>
              )}
              {inclusiveTax > 0 && (
                <div style={{textAlign:"center",fontSize:".75rem",color:"#6B4C38",marginTop:-4,marginBottom:4}}>
                  * Includes {taxCfg.label} ({taxCfg.rate}%): {fmt(inclusiveTax)}
                </div>
              )}
              {(discount > 0 || walletApplied > 0) && (
                <div style={{textAlign:"center",fontSize:".78rem",color:"#2D7D46",fontWeight:600,marginTop:2,marginBottom:8}}>
                  🎉 You're saving {fmt(discount + walletApplied)} on this order!
                </div>
              )}
              <button type="submit" className="pay-btn" disabled={placing}>
                {placing ? "Placing order…"
                  : amountToPay === 0 ? "Place Order (Wallet Paid) →"
                  : `Pay ${fmt(amountToPay)} →`}
              </button>
              <div className="razorpay-note">🔒 Secured by Razorpay · UPI · Cards · Wallets</div>
            </div>
          </div>
        </div>
      </form>
    </div>

    {rzpCheckoutOpen && (
      <RazorpayModal
        amount={amountToPay}
        purpose="Order Payment"
        onSuccess={handleRzpSuccess}
        onClose={() => setRzpCheckoutOpen(false)}
      />
    )}

    {rzpOpen && parseFloat(rzpAmt) >= 10 && (
      <RazorpayModal
        amount={parseFloat(rzpAmt)}
        purpose="Wallet Top Up"
        onSuccess={async () => {
          setRzpOpen(false);
          setTopUpOpen(false);
          const amt = parseFloat(rzpAmt);
          setRzpAmt("");
          if (user?.uid) await rechargeWallet(user.uid, amt);
        }}
        onClose={() => setRzpOpen(false)}
      />
    )}
    </>
  );
}
