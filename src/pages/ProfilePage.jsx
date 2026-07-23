import { useState, useEffect, useRef } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { subscribeUserNotifs, markRead, markAllRead, dismissNotif, isNotifRead } from "../firebase/notifService";
import { subscribeWalletBalance, subscribeWalletTxns, rechargeWallet } from "../firebase/walletService";
import { subscribeUserTickets, addReply, subscribeTicket, markCustomerRead } from "../firebase/supportService";
import { uploadSupportAttachment } from "../firebase/storageService";
import { db } from "../firebase/config";
import { fmt, NoImageIcon } from "../utils/helpers";
import { subscribeOrdersByUser, cancelOrder } from "../firebase/orderService";
import { notifyOrderCancelled } from "../firebase/notificationService";
import { callProcessRefund } from "../services/razorpayService";
import { logout, changePassword, unlinkGoogle, getLinkedProviders } from "../firebase/authService";
import { generateOtp, sendOtp, sendConfirmationEmail } from "../firebase/otpService";
import InvoiceModal from "../components/InvoiceModal";
import RazorpayModal from "../components/RazorpayModal";
import ReturnExchangeModal from "../components/ReturnExchangeModal";
import ReturnTrackingModal from "../components/ReturnTrackingModal";
import OtpVerifyModal from "../components/OtpVerifyModal";
import { getWishlistIds, toggleWishlist } from "../utils/wishlist";
import { getUserDesigns, deleteDesign } from "../firebase/roomDesignService";

// ── Address & Payment helpers ─────────────────────────────────────────────────
const addrUid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const ADDR_LABELS = ["Home", "Work", "Other"];
const ADDR_ICONS  = { Home:"🏠", Work:"💼", Other:"📍" };
const BLANK_ADDR = { label:"Home", name:"", email:"", phone:"", line1:"", city:"", state:"", pin:"", isDefault:false };
const BLANK_PAY  = { type:"upi", label:"", upiId:"", cardDisplay:"", isDefault:false };

const OB = { background:"none", border:"1px solid var(--bd)", borderRadius:8, padding:"4px 12px", cursor:"pointer", fontSize:".75rem", color:"var(--mt)", fontFamily:"DM Sans,sans-serif" };
const DB = { background:"#FEF0EF", border:"1.5px solid #FADBD8", borderRadius:8, padding:"4px 12px", cursor:"pointer", fontSize:".75rem", color:"#C0392B", fontFamily:"DM Sans,sans-serif" };

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
  "Andhra Pradesh":["Visakhapatnam","Vijayawada","Guntur","Nellore","Kurnool","Tirupati","Rajahmundry","Kakinada","Kadapa","Anantapur","Eluru","Ongole","Nandyal","Machilipatnam","Adoni","Tenali","Proddatur","Chittoor","Hindupur","Bhimavaram","Madanapalle","Guntakal","Dharmavaram","Gudivada","Narasaraopet","Tadipatri","Tadepalligudem","Chilakaluripet","Yemmiganur","Markapur","Vizianagaram","Srikakulam","Narasapuram","Palakollu","Palasa","Bobbili","Rajam","Tekkali","Salur","Parvatipuram","Amalapuram","Pithapuram","Tuni","Samalkot","Mandapeta","Kovvur","Nidadavole","Bapatla","Sattenapalle","Piduguralla","Vinukonda","Macherla","Ponnur","Repalle","Nidubrolu","Atmakur","Dhone","Allagadda","Banaganapalle","Betamcherla","Giddalur","Yerragondapalem","Kanigiri","Podili","Ongole","Chirala","Vetapalem","Addanki","Kandukur","Ramachandrapuram"],
  "Arunachal Pradesh":["Itanagar","Naharlagun","Pasighat","Tezpur","Bomdila","Ziro","Along","Tezu","Roing","Khonsa","Changlang","Daporijo","Anini","Seppa","Tawang","Longding","Namsai","Yazali","Basar","Mechuka"],
  "Assam":["Guwahati","Silchar","Dibrugarh","Jorhat","Nagaon","Tinsukia","Tezpur","Bongaigaon","Dhubri","Diphu","Goalpara","Karimganj","Sivsagar","Golaghat","Barpeta","Lakhimpur","Hailakandi","Nalbari","Kokrajhar","Haflong","Lumding","Hojai","Morigaon","Rangia","Barpeta Road","North Lakhimpur","Sibsagar","Nazira","Sonari","Demow","Amguri","Sarupathar","Titabor","Mariani","Gauripur","Bilasipara","Abhayapuri","Pathsala","Tihu","Chaygaon"],
  "Bihar":["Patna","Gaya","Bhagalpur","Muzaffarpur","Purnia","Darbhanga","Bihar Sharif","Arrah","Begusarai","Katihar","Munger","Chhapra","Danapur","Saharsa","Hajipur","Dehri","Siwan","Motihari","Nawada","Bagaha","Bettiah","Sasaram","Madhubani","Kishanganj","Aurangabad","Jehanabad","Lakhisarai","Sheikhpura","Supaul","Araria","Khagaria","Buxar","Sherghati","Bodh Gaya","Rajgir","Barh","Mokama","Fatuha","Hilsa","Islampur","Barbigha","Nalanda","Bihta","Masaurhi"],
  "Chhattisgarh":["Raipur","Bhilai","Bilaspur","Korba","Durg","Rajnandgaon","Jagdalpur","Raigarh","Ambikapur","Dhamtari","Mahasamund","Kanker","Janjgir","Champa","Sakti","Mungeli","Kawardha","Balod","Baloda Bazar","Bemetara","Gariaband","Kondagaon","Sukma","Narayanpur","Bijapur","Surajpur","Balrampur","Jashpur","Korea","Baikunthpur","Dongargarh","Tilda","Arang","Abhanpur","Dharsiwa","Simga","Bhatapara","Kasdol","Pithora"],
  "Goa":["Panaji","Vasco da Gama","Margao","Mapusa","Ponda","Bicholim","Curchorem","Calangute","Baga","Anjuna","Candolim","Vagator","Pernem","Sanguem","Canacona","Quepem","Valpoi","Cuncolim","Sanquelim","Cortalim","Aldona","Saligao","Porvorim","Taleigao","Bambolim","Miramar","Dona Paula"],
  "Gujarat":["Ahmedabad","Surat","Vadodara","Rajkot","Bhavnagar","Jamnagar","Junagadh","Gandhinagar","Anand","Nadiad","Morbi","Mehsana","Bharuch","Porbandar","Palanpur","Valsad","Navsari","Veraval","Surendranagar","Gandhidham","Godhra","Patan","Dahod","Amreli","Botad","Dwarka","Vyara","Bardoli","Ankleshwar","Vapi","Gondal","Jetpur","Wankaner","Dhrangadhra","Halvad","Limbdi","Wadhwan","Chotila","Jasdan","Dhoraji","Upleta","Rajula","Mahuva","Sihor","Talaja","Palitana","Okha","Salaya","Khambhalia","Kalawad","Viramgam","Sanand","Bavla","Dholka","Dhandhuka","Ranpur","Borsad","Kheda","Matar","Petlad","Umreth","Anand","Vallabh Vidyanagar","Karamsad","Tarapur","Kapadvanj","Lunawada","Halol","Kalol","Modasa","Idar","Himatnagar","Shamlaji","Khedbrahma","Prantij","Unjha","Visnagar","Kadi","Mansa","Vijapur","Sidhpur","Patan","Chanasma","Harij","Radhanpur","Deesa","Dantiwada","Vadgam","Vav","Sami","Santalpur","Kankrej","Tharad","Dhanera","Bhabhar"],
  "Haryana":["Faridabad","Gurgaon","Panipat","Ambala","Yamunanagar","Rohtak","Hisar","Karnal","Sonipat","Panchkula","Bhiwani","Sirsa","Bahadurgarh","Jind","Thanesar","Kaithal","Rewari","Palwal","Narnaul","Fatehabad","Mahendragarh","Nuh","Jhajjar","Charkhi Dadri","Hansi","Tosham","Adampur","Uklana","Barwala","Ratia","Jakhal","Tohana","Bhuna","Narwana","Safidon","Julana","Uchana","Assandh","Gharaunda","Indri","Nilokheri","Taraori","Pehowa","Shahabad","Ladwa","Ismailabad","Kurukshetra","Pundri"],
  "Himachal Pradesh":["Shimla","Mandi","Solan","Dharamshala","Kullu","Hamirpur","Una","Nahan","Palampur","Baddi","Bilaspur","Chamba","Kangra","Nurpur","Dalhousie","Manali","Kasauli","Parwanoo","Nalagarh","Sundernagar","Rampur","Rekong Peo","Sangla","Kalpa","Keylong","Arki","Sarkaghat","Sujanpur","Dera Gopipur","Jawali","Bhota","Amb","Barsar","Multhan","Gagret","Haroli","Bangana"],
  "Jharkhand":["Ranchi","Jamshedpur","Dhanbad","Bokaro","Deoghar","Hazaribagh","Giridih","Ramgarh","Medininagar","Chakradharpur","Phusro","Chirkunda","Jharia","Sindri","Godda","Dumka","Pakur","Sahibganj","Rajmahal","Lohardaga","Gumla","Simdega","Khunti","Saraikela","Chaibasa","Chakulia","Baharagora","Ghatsila","Musabani","Adityapur","Gamharia","Mango","Jugsalai"],
  "Karnataka":["Bengaluru","Mysuru","Hubli","Mangaluru","Belagavi","Kalaburagi","Ballari","Vijayapura","Shivamogga","Tumkur","Davanagere","Bidar","Raichur","Hassan","Hospet","Udupi","Chitradurga","Bhadravati","Mandya","Chikmagalur","Dharwad","Bagalkot","Gadag","Haveri","Koppal","Yadgir","Chamarajanagar","Kodagu","Chikkaballapur","Kolar","Ramnagara","Nelamangala","Doddaballapur","Devanahalli","Hoskote","Malur","Mulbagal","Robertsonpet","Kolar Gold Fields","Srinivaspur","Bangarpet","Sidlaghatta","Chintamani","Gauribidanur","Madhugiri","Sira","Pavagada","Koratagere","Tiptur","Turuvekere","Kunigal","Gubbi","Srirangapatna","Malavalli","Maddur","Nagamangala","Krishnarajapete","Pandavapura","Channapatna","Ramanagara","Kanakapura","Magadi","Anekal","Sarjapur","Attibele","Nanjangud","Gundlupet","Kollegal","T Narsipur","Hunsur","Periyapatna","Kushalnagar","Virajpet","Madikeri","Somwarpet"],
  "Kerala":["Thiruvananthapuram","Kochi","Kozhikode","Kollam","Thrissur","Palakkad","Alappuzha","Malappuram","Kannur","Kasaragod","Manjeri","Thalassery","Kottayam","Ernakulam","Changanacherry","Punalur","Kayamkulam","Attingal","Varkala","Neyyattinkara","Nedumangad","Pathanamthitta","Adoor","Tiruvalla","Ranni","Pandalam","Maramon","Kozhencherry","Konni","Aranmula","Chengannur","Mavelikkara","Haripad","Ambalappuzha","Cherthala","Kuttanad","Vaikom","Ettumanoor","Pala","Thodupuzha","Idukki","Munnar","Devikulam","Peermade","Adimali","Kothamangalam","Perumbavoor","Aluva","Angamaly","Chalakudy","Kodungallur","Irinjalakuda","Guruvayur","Kunnamkulam","Chavakkad","Kodakara","Ottappalam","Shoranur","Mannarkkad","Perinthalmanna","Tirur","Tirurrangadi","Kottakkal","Ponnani","Tanur","Parappanangadi","Valanchery","Kondotty","Nilambur","Wandoor","Vadakara","Vatakara","Quilandy","Feroke","Koyilandy","Koduvally","Perambra","Thamarassery","Mukkam","Ramanattukara","Iritty","Mattannur","Kuthuparamba","Sreekandapuram","Payyanur","Nileshwaram","Kanhangad","Bekal","Hosdurg","Manjeswaram"],
  "Madhya Pradesh":["Indore","Bhopal","Jabalpur","Gwalior","Ujjain","Sagar","Ratlam","Satna","Singrauli","Rewa","Burhanpur","Khandwa","Bhind","Chhindwara","Guna","Shivpuri","Vidisha","Damoh","Mandsaur","Khargone","Neemuch","Dewas","Hoshangabad","Itarsi","Sehore","Seoni","Balaghat","Narsinghpur","Panna","Chhatarpur","Tikamgarh","Nowgong","Shahganj","Khajuraho","Maihar","Amarpatan","Nagod","Chitrakoot","Shahdol","Anuppur","Umaria","Katni","Murwara","Sihora","Barela","Mandla","Dindori","Nainpur","Waraseoni","Baihar","Lakhnadon","Gadarwara","Tewar","Hatta","Jabera","Patharia","Rahatgarh","Khurai","Rajgarh","Biaora","Berasia","Obedullahganj","Mandideep","Sanchi"],
  "Maharashtra":["Mumbai","Pune","Nagpur","Thane","Nashik","Aurangabad","Solapur","Amravati","Kolhapur","Navi Mumbai","Akola","Latur","Dhule","Ahmednagar","Chandrapur","Parbhani","Jalgaon","Bhiwandi","Malegaon","Nanded","Sangli","Satara","Ratnagiri","Vasai-Virar","Kalyan","Ulhasnagar","Panvel","Yavatmal","Osmanabad","Wardha","Washim","Buldana","Hingoli","Jalna","Beed","Nandurbar","Gondia","Gadchiroli","Sindhudurg","Raigad","Alibag","Pen","Uran","Khopoli","Roha","Mangaon","Mahad","Poladpur","Shrivardhan","Murud","Chaul","Karjat","Nagothane","Tala","Mhasla","Chiplun","Sangameshwar","Rajapur","Devgad","Malvan","Kudal","Vengurla","Sawantwadi","Shiroda","Kankavli","Oras","Vaibhavwadi"],
  "Manipur":["Imphal","Thoubal","Kakching","Churachandpur","Bishnupur","Senapati","Moreh","Ukhrul","Chandel","Jiribam","Tamenglong","Noney","Kangpokpi","Pherzawl","Tengnoupal","Kamjong"],
  "Meghalaya":["Shillong","Tura","Jowai","Nongstoin","Baghmara","Williamnagar","Resubelpara","Mawkyrwat","Mairang","Nongpoh","Cherrapunjee","Mawsynram","Dawki","Mawlai","Laban","Umiam"],
  "Mizoram":["Aizawl","Lunglei","Saiha","Champhai","Serchhip","Kolasib","Lawngtlai","Mamit","Siaha","Khawzawl","Hnahthial","Saitual"],
  "Nagaland":["Kohima","Dimapur","Mokokchung","Tuensang","Wokha","Zunheboto","Phek","Mon","Longleng","Peren","Kiphire","Noklak"],
  "Odisha":["Bhubaneswar","Cuttack","Rourkela","Brahmapur","Sambalpur","Puri","Balasore","Bhadrak","Baripada","Jharsuguda","Balangir","Angul","Dhenkanal","Paradip","Bargarh","Sundargarh","Kendujhar","Rayagada","Koraput","Nabarangpur","Malkangiri","Nuapada","Sonepur","Baudh","Nayagarh","Khordha","Jagatsinghpur","Kendrapara","Jajpur","Mayurbhanj","Keonjhar","Phulbani","Berhampur","Jeypore","Titilagarh","Bhawanipatna","Kalahandi","Dharmagarh","Junagarh","Kesinga","Muniguda","Umerkote","Chitrakonda","Nowrangapur","Kotpad","Jaypur","Similiguda","Damanjodi","Sunabeda","Borigumma","Padampur","Tusura","Muribahal","Belpara","Kantabanji","Patnagarh","Loisingha"],
  "Punjab":["Ludhiana","Amritsar","Jalandhar","Patiala","Bathinda","Hoshiarpur","Batala","Pathankot","Moga","Abohar","Malerkotla","Khanna","Phagwara","Muktsar","Barnala","Rajpura","Firozpur","Kapurthala","Faridkot","Fazilka","Gurdaspur","Nawanshahr","Ropar","Sangrur","Mansa","Tarn Taran","Mohali","Zirakpur","Kharar","Derabassi","Morinda","Fatehgarh Sahib","Sirhind","Nabha","Sunam","Moonak","Dhuri","Lehragaga","Longowal","Amargarh","Ahmedgarh","Raikot","Jagraon","Samrala","Machhiwara","Doraha","Fatehgarh Churian","Dera Baba Nanak","Qadian","Dinanagar","Sujanpur","Mukerian","Dasuya","Garhdiwala","Anandpur Sahib","Nangal","Rupnagar"],
  "Rajasthan":["Jaipur","Jodhpur","Kota","Bikaner","Ajmer","Udaipur","Bhilwara","Alwar","Bharatpur","Sikar","Pali","Sri Ganganagar","Kishangarh","Tonk","Churu","Beawar","Hanumangarh","Sawai Madhopur","Chittorgarh","Nagaur","Barmer","Jhunjhunu","Banswara","Bundi","Dhaulpur","Dungarpur","Jalore","Sirohi","Rajsamand","Pratapgarh","Karauli","Dausa","Dholpur","Balotra","Pachpadra","Gudamalani","Siwana","Chauhtan","Sindari","Baytu","Sheo","Ramsar","Chohtan","Dhorimanna","Samdari","Jasol","Pipar","Bilara","Nokha","Kolayat","Khajuwala","Lunkaransar","Sridungargarh","Ratangarh","Sujangarh","Sardarshahar","Rajgarh","Taranagar","Sadulpur","Nohar","Rawatsar","Pilibanga","Sangaria","Tibi","Karanpur","Raisinghnagar","Padampur","Anupgarh","Gharsana"],
  "Sikkim":["Gangtok","Namchi","Gyalshing","Mangan","Rangpo","Singtam","Jorethang","Ravangla","Yuksom","Pelling","Lachen","Lachung","Chungthang","Rongli","Pakyong"],
  "Tamil Nadu":["Chennai","Coimbatore","Madurai","Tiruchirappalli","Salem","Tirunelveli","Tiruppur","Vellore","Erode","Thoothukkudi","Thanjavur","Dindigul","Ranipet","Sivakasi","Karur","Ooty","Hosur","Nagercoil","Kanchipuram","Kumbakonam","Tiruvallur","Tiruvannamalai","Pollachi","Rajapalayam","Cuddalore","Nagapattinam","Villupuram","Pudukottai","Virudhunagar","Tenkasi","Ramanathapuram","Sivaganga","Ariyalur","Perambalur","Namakkal","Nilgiris","Krishnagiri","Dharmapuri","Thiruvarur","Mayiladuthurai","Kallakurichi","Chengalpattu","Tirupattur","Ambur","Vaniyambadi","Gudiyatham","Arani","Arcot","Cheyyar","Polur","Arni","Vandavasi","Gingee","Tindivanam","Ulundurpet","Sankarapuram","Chinnasalem","Attur","Mettur","Edappadi","Valapady","Omalur","Rasipuram","Tiruchengode","Kumarapalayam","Velur","Pallipalayam","Bhavani","Gobichettipalayam","Anthiyur","Modakkurichi","Avinashi","Palladam","Dharapuram","Kangayam","Udumalpet","Valparai","Anamalai","Mettupalayam","Gudalur","Coonoor","Kotagiri","Oddanchatram","Vedasandur","Nilakottai","Natham","Batlagundu","Kodaikanal","Bodinayakanur","Theni","Periyakulam","Uthamapalayam","Melur","Tirumangalam","Usilampatti","Vadipatti","Sivagangai","Karaikudi","Devakottai","Ilayangudi","Manamadurai","Aruppukkottai","Sattur","Watrap","Kovilpatti","Ambasamudram","Palayankottai","Alangulam","Kadayanallur","Shencottah","Sankarankovil","Cheranmahadevi","Nanguneri","Radhapuram","Valliyur","Padmanabhapuram","Marthandam","Colachel","Thuckalay","Kulasekharapuram","Eraniel","Kanyakumari"],
  "Telangana":["Hyderabad","Warangal","Nizamabad","Khammam","Karimnagar","Ramagundam","Mahabubnagar","Nalgonda","Adilabad","Suryapet","Miryalaguda","Siddipet","Mancherial","Jagtial","Bhongir","Kothagudem","Bodhan","Sangareddy","Zahirabad","Wanaparthy","Jangaon","Bhadrachalam","Nirmal","Metpally","Nagarkurnool","Vikarabad","Medak","Kamareddy","Tandur","Shadnagar","Gadwal","Narayanpet","Achampet","Kollapur","Kalwakurthy","Alampur","Mahbubnagar","Jadcherla","Kosgi","Makthal","Kodangal","Farooqnagar","Tandur","Parigi","Nawabpet","Shabad","Chevella","Moinabad","Rajendranagar","Ibrahimpatnam","Hayathnagar","Ghatkesar","Keesara","Alwal","Kompally","Quthbullapur","Medchal","Shamirpet","Narsapur","Toopran","Papannapet","Ramayampet","Narayankhed","Shivampet","Andol","Shankarampet","Gummadidala","Sadasivapet","Kohir","Jogipet","Nyalkal","Banswada","Yellareddy","Armur","Nandipeta","Balkonda","Koratla","Jagtial","Raikal","Bheemgal","Karimnagar","Sircilla","Vemulawada","Huzurabad","Manthani","Bellampalle","Chennur","Luxettipet","Sirpur","Bhainsa","Khanapur","Jainath","Utnoor","Ichoda","Boath","Dilawarpur","Mudhole","Bazarhatnoor","Wankidi","Asifabad","Kaghaznagar","Sirpur Kagaznagar","Mandamarri","Palvancha","Yellandu","Sathupally","Manuguru","Aswapuram","Julurpad","Kodad","Huzurnagar","Nakrekal","Tirumalapur","Devarakonda","Yadagirigutta","Alair","Ramannapet","Neredcharla","Mothkur","Chandur"],
  "Tripura":["Agartala","Dharmanagar","Udaipur","Kailasahar","Belonia","Khowai","Ambassa","Bishalgarh","Sabroom","Melaghar","Kamalpur","Amarpur","Sonamura","Kumarghat","Panisagar","Dhalai","Sepahijala","Gomati","Unakoti"],
  "Uttar Pradesh":["Lucknow","Kanpur","Ghaziabad","Agra","Meerut","Varanasi","Prayagraj","Bareilly","Aligarh","Moradabad","Saharanpur","Gorakhpur","Noida","Firozabad","Jhansi","Muzaffarnagar","Mathura","Shahjahanpur","Rampur","Etawah","Farrukhabad","Hapur","Mirzapur","Bulandshahr","Hardoi","Fatehpur","Rae Bareli","Sitapur","Bahraich","Jaunpur","Lakhimpur","Hathras","Banda","Gonda","Mainpuri","Deoria","Azamgarh","Ballia","Sultanpur","Unnao","Bijnor","Amroha","Sambhal","Badaun","Pilibhit","Kasganj","Etah","Auraiya","Kannauj","Orai","Lalitpur","Hamirpur","Mahoba","Chitrakoot","Kushinagar","Maharajganj","Siddharth Nagar","Basti","Sant Kabir Nagar","Ambedkar Nagar","Amethi","Ayodhya","Shravasti","Balrampur","Lakhimpur Kheri","Kaushambi","Pratapgarh","Sonbhadra","Chandauli","Ghazipur","Mau","Bhadohi"],
  "Uttarakhand":["Dehradun","Haridwar","Roorkee","Haldwani","Rudrapur","Kashipur","Rishikesh","Kotdwar","Ramnagar","Pithoragarh","Almora","Nainital","Mussoorie","Tehri","Uttarkashi","Chamoli","Gopeshwar","Joshimath","Badrinath","Kedarnath","Gangotri","Yamunotri","Lansdowne","Pauri","Srinagar Garhwal","Rudraprayag","Karnaprayag","Devprayag","Manglaur","Laksar","Jwalapur","Kichha","Sitarganj","Gadarpur","Jaspur","Bazpur","Dineshpur","Bhimtal","Bhowali","Ramgarh","Ranikhet","Chaubattia","Mukteshwar","Binsar","Bageshwar","Kapkot","Thal","Munsiyari","Dharchula","Champawat","Lohaghat","Tanakpur","Banbasa"],
  "West Bengal":["Kolkata","Asansol","Siliguri","Durgapur","Bardhaman","Malda","Baharampur","Habra","Kharagpur","Shantipur","Ranaghat","Haldia","Raiganj","Krishnanagar","Nabadwip","Medinipur","Jalpaiguri","Balurghat","Basirhat","Bankura","Darjeeling","Alipurduar","Purulia","Jangipur","Cooch Behar","Domjur","Uluberia","Bally","Howrah","Serampore","Chandannagar","Rishra","Hooghly","Arambagh","Goghat","Khanakul","Tarakeswar","Haripal","Dhaniakhali","Balagarh","Polba","Pursurah","Singur","Champdani","Baidyabati","Konnagar","Uttarpara","Kalyani","Chakdah","Birnagar","Gayespur","Haringhata","Bagula","Tehatta","Chapra","Karimpur","Murshidabad","Jiaganj","Azimganj","Berhampore","Lalgola","Suti","Farakka","Manikchak","Kaliachak","Ratua","Harishchandrapur","Chanchal","Gazole","Bamangola","Habibpur","Old Malda","English Bazar","Islampur","Hemtabad","Karandighi","Itahar","Dalkhola","Kaliyaganj","Kushmandi","Gangarampur","Tapan","Buniadpur","Hili","Dinhata","Tufanganj","Sitai","Sitalkuchi","Mathabhanga","Mekhliganj","Haldibari","Dhupguri","Mal","Rajganj","Mainaguri","Kumargram","Falakata","Madarihat"],
  "Andaman and Nicobar Islands":["Port Blair","Diglipur","Rangat","Mayabunder","Campbell Bay","Hut Bay","Car Nicobar","Kamorta","Nancowry","Katchal"],
  "Chandigarh":["Chandigarh","Manimajra","Panchkula","Mohali","Zirakpur","Kharar","Derabassi"],
  "Dadra and Nagar Haveli and Daman and Diu":["Daman","Diu","Silvassa","Amli","Khanvel","Dadra"],
  "Delhi":["New Delhi","Dwarka","Rohini","Saket","Lajpat Nagar","Karol Bagh","Connaught Place","Janakpuri","Pitampura","Vasant Kunj","Mayur Vihar","Shahdara","Preet Vihar","Narela","Bawana","Kirari","Mundka","Rajouri Garden","Patel Nagar","Punjabi Bagh","Paschim Vihar","Uttam Nagar","Bindapur","Vikaspuri","Tilak Nagar","Subhash Nagar","Tagore Garden","Moti Nagar","Kirti Nagar","Ramesh Nagar","Rajinder Nagar","Paharganj","Sadar Bazar","Civil Lines","Kashmere Gate","Dilshad Garden","Vivek Vihar","Seema Puri","Nand Nagri","Bhajanpura","Seelampur","Welcome","Jaffrabad","Maujpur","Karawal Nagar","Mustafabad","Pitampura","Shalimar Bagh","Ashok Vihar","Wazirpur","Model Town","Mukherjee Nagar","GTB Nagar","Adarsh Nagar","Azadpur","Jahangirpuri","Mangolpuri","Sultanpuri","Mundka","Nangloi","Najafgarh","Palam","Mahipalpur","Rangpuri","Vasant Vihar","Munirka","RK Puram","Sarojini Nagar","Safdarjung"],
  "Jammu and Kashmir":["Srinagar","Jammu","Anantnag","Baramulla","Sopore","Bijbehara","Udhampur","Kathua","Punch","Rajouri","Doda","Kishtwar","Reasi","Ramban","Banihal","Qazigund","Kulgam","Shopian","Pulwama","Budgam","Ganderbal","Bandipora","Gurez"],
  "Ladakh":["Leh","Kargil","Nubra","Zanskar","Diskit","Sumur","Panamik","Turtuk","Nyoma","Hanle","Durbuk","Chushul","Padum","Zangla","Rangdum"],
  "Lakshadweep":["Kavaratti","Agatti","Amini","Andrott","Minicoy","Kalpeni","Kiltan","Chetlat","Bitra","Bangaram"],
  "Puducherry":["Puducherry","Karaikal","Mahe","Yanam","Oulgaret","Villianur","Ariyankuppam","Nettapakkam","Mannadipet","Bahour"],
};

function AddrForm({ form, onChange, onSave, onCancel, saving, editId }) {
  const [pinLookup, setPinLookup] = useState({ loading: false, error: "" });
  const [cityDraft,  setCityDraft]  = useState({ active: false, val: "" });
  const inputSt = { width:"100%", padding:"9px 12px", border:"1.5px solid var(--bd)", borderRadius:9, fontSize:".88rem", fontFamily:"DM Sans,sans-serif", outline:"none", boxSizing:"border-box" };
  const labelSt = { fontSize:".75rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", color:"#6B4C38", display:"block", marginBottom:5 };

  const handlePinChange = async (pin) => {
    onChange("pin", pin);
    // Clear stale city/state the moment a new 6-digit pin is entered
    if (pin.length === 6) { onChange("city", ""); onChange("state", ""); }
    if (pin.length !== 6) { setPinLookup({ loading: false, error: "" }); return; }
    setPinLookup({ loading: true, error: "" });
    // Try India Post API first
    try {
      const r1   = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const d1   = await r1.json();
      if (d1[0]?.Status === "Success" && d1[0].PostOffice?.length > 0) {
        const po = d1[0].PostOffice[0];
        onChange("city",  po.District || po.Name || "");
        onChange("state", po.State || "");
        setPinLookup({ loading: false, error: "" });
        return;
      }
    } catch { /* fall through */ }

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
          onChange("state", state);
          onChange("city",  city || "");
          setPinLookup({ loading: false, error: "" });
          return;
        }
      }
    } catch { /* fall through */ }

    // Both unavailable – leave fields empty for manual entry
    setPinLookup({ loading: false, error: "" });
  };

  const handleCityChange = async (city) => {
    onChange("city", city);
    onChange("pin", "");
    setPinLookup({ loading: false, error: "" });
    if (!city || !form.state || !(CITIES_BY_STATE[form.state] || []).includes(city)) return;
    setPinLookup({ loading: true, error: "" });
    try {
      const r1 = await fetch(`https://api.postalpincode.in/postoffice/${encodeURIComponent(city)}`);
      const d1 = await r1.json();
      if (d1[0]?.Status === "Success" && d1[0].PostOffice?.length > 0) {
        const po = d1[0].PostOffice.find(p => p.State === form.state) || d1[0].PostOffice[0];
        if (/^\d{6}$/.test(po?.Pincode)) {
          onChange("pin", po.Pincode);
          setPinLookup({ loading: false, error: "" });
          return;
        }
      }
    } catch { }
    try {
      const r2 = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city + ", " + form.state + ", India")}&format=json&addressdetails=1&limit=1`
      );
      const d2 = await r2.json();
      if (d2[0]?.address?.postcode) {
        const pin = d2[0].address.postcode.replace(/\D/g, "").slice(0, 6);
        if (pin.length === 6) { onChange("pin", pin); setPinLookup({ loading: false, error: "" }); return; }
      }
    } catch { }
    setPinLookup({ loading: false, error: "" });
  };

  return (
    <div style={{ background:"#FFF8F3", border:"1.5px solid var(--bd)", borderRadius:12, padding:20, marginBottom:16 }}>
      <div style={{ fontWeight:700, fontSize:".9rem", color:"var(--dk)", marginBottom:14 }}>
        {editId ? "Edit Address" : "Add New Address"}
      </div>

      {/* Label picker */}
      <div style={{ marginBottom:14 }}>
        <span style={labelSt}>Label</span>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {ADDR_LABELS.map(l => (
            <button key={l} type="button" onClick={() => onChange("label", l)}
              style={{ padding:"5px 16px", borderRadius:20, border:"1.5px solid",
                borderColor: form.label === l ? "var(--sf)" : "var(--bd)",
                background: form.label === l ? "var(--sf)" : "#fff",
                color: form.label === l ? "#fff" : "var(--mt)",
                fontSize:".82rem", fontWeight:600, cursor:"pointer", fontFamily:"DM Sans,sans-serif" }}>
              {ADDR_ICONS[l]} {l}
            </button>
          ))}
          <input placeholder="Custom label"
            value={!ADDR_LABELS.includes(form.label) ? form.label : ""}
            onChange={e => onChange("label", e.target.value)}
            style={{ ...inputSt, width:130, padding:"5px 12px" }}/>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
        <div><label style={labelSt}>Full Name *</label>
          <input style={inputSt} placeholder="Full name" value={form.name} onChange={e => onChange("name", e.target.value)}/></div>
        <div><label style={labelSt}>Phone *</label>
          <input style={inputSt} placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={e => onChange("phone", e.target.value)}/></div>
        <div style={{ gridColumn:"1/-1" }}><label style={labelSt}>Email</label>
          <input style={inputSt} type="email" placeholder="you@example.com" value={form.email} onChange={e => onChange("email", e.target.value)}/></div>
        <div style={{ gridColumn:"1/-1" }}><label style={labelSt}>Street Address *</label>
          <input style={inputSt} placeholder="House / Flat, Street, Area" value={form.line1} onChange={e => onChange("line1", e.target.value)}/></div>

        {/* PIN code — auto-fills city & state */}
        <div style={{ gridColumn:"1/-1" }}>
          <label style={labelSt}>
            PIN Code *
            {pinLookup.loading && <span style={{marginLeft:8,fontSize:".72rem",color:"#E8620A",fontWeight:400,textTransform:"none"}}>Looking up…</span>}
            {pinLookup.error   && <span style={{marginLeft:8,fontSize:".72rem",color:"#C0392B",fontWeight:400,textTransform:"none"}}>{pinLookup.error}</span>}
            {!pinLookup.loading && !pinLookup.error && form.city && form.state && form.pin.length===6 &&
              <span style={{marginLeft:8,fontSize:".72rem",color:"#2D7D46",fontWeight:400,textTransform:"none"}}>✓ Auto-filled</span>}
          </label>
          <input style={{...inputSt, ...(form.pin.length===6 && !pinLookup.error ? {borderColor:"#A8D5B5"} : {})}}
            placeholder="6-digit PIN" maxLength={6}
            value={form.pin}
            onChange={e => handlePinChange(e.target.value.replace(/\D/g, ""))}/>
        </div>

        {/* State dropdown */}
        <div>
          <label style={labelSt}>State *</label>
          <select value={form.state}
            onChange={e => { onChange("state", e.target.value); onChange("city", ""); onChange("pin", ""); setPinLookup({ loading: false, error: "" }); }}
            style={{...inputSt, color: form.state ? "var(--dk)" : "var(--mt)", appearance:"auto"}}>
            <option value="">Select State</option>
            {INDIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* City datalist filtered by state */}
        <div>
          <label style={labelSt}>City / Town *</label>
          <input style={{...inputSt, color: !form.state ? "var(--mt)" : "var(--dk)"}}
            list="prof-city-list"
            placeholder={form.state ? "Type or select city" : "Select state first"}
            value={cityDraft.active ? cityDraft.val : form.city}
            disabled={!form.state}
            onFocus={() => setCityDraft({ active: true, val: "" })}
            onBlur={() => setCityDraft({ active: false, val: "" })}
            onChange={e => { setCityDraft(p => ({ ...p, val: e.target.value })); handleCityChange(e.target.value); }}/>
          <datalist id="prof-city-list">
            {[...new Set(CITIES_BY_STATE[form.state] || [])].map(c => <option key={c} value={c}/>)}
          </datalist>
        </div>
      </div>

      <label style={{ display:"flex", alignItems:"center", gap:8, fontSize:".85rem", marginBottom:16, cursor:"pointer" }}>
        <input type="checkbox" checked={form.isDefault} onChange={e => onChange("isDefault", e.target.checked)}/>
        Set as default address
      </label>
      <div style={{ display:"flex", gap:8 }}>
        <button className="btn-sf" style={{ padding:"9px 22px", borderRadius:10, fontSize:".88rem" }}
          onClick={onSave} disabled={saving || !form.name || !form.phone || !form.line1 || !form.city || !form.state || !form.pin}>
          {saving ? "Saving…" : editId ? "Update Address" : "Save Address"}
        </button>
        <button type="button" onClick={onCancel}
          style={{ padding:"9px 18px", border:"1.5px solid var(--bd)", background:"none", borderRadius:10,
            cursor:"pointer", fontSize:".88rem", color:"var(--mt)", fontFamily:"DM Sans,sans-serif" }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function AddressSection({ uid }) {
  const [addresses, setAddresses] = useState([]);
  const [loadDone, setLoadDone]   = useState(false);
  const [showForm, setShowForm]   = useState(false);
  const [editId, setEditId]       = useState(null);
  const [form, setForm]           = useState(BLANK_ADDR);
  const [saving, setSaving]       = useState(false);

  useEffect(() => {
    getDoc(doc(db, "users", uid)).then(snap => {
      setAddresses(snap.exists() ? snap.data().addresses || [] : []);
      setLoadDone(true);
    }).catch(() => setLoadDone(true));
  }, [uid]);

  const persist = async (list) => {
    setAddresses(list);
    await updateDoc(doc(db, "users", uid), { addresses: list });
  };

  const ensureDefault = (list) => {
    if (list.length === 0 || list.some(a => a.isDefault)) return list;
    return list.map((a, i) => ({ ...a, isDefault: i === 0 }));
  };

  const saveAddress = async () => {
    setSaving(true);
    const id = editId || addrUid();
    let updated = editId
      ? addresses.map(a => a.id === editId ? { ...form, id } : a)
      : [...addresses, { ...form, id }];
    if (form.isDefault) updated = updated.map(a => ({ ...a, isDefault: a.id === id }));
    updated = ensureDefault(updated);
    await persist(updated);
    setShowForm(false); setEditId(null); setForm(BLANK_ADDR); setSaving(false);
  };

  const deleteAddr = async (id) => {
    await persist(ensureDefault(addresses.filter(a => a.id !== id)));
  };

  const setDefault = async (id) => {
    await persist(addresses.map(a => ({ ...a, isDefault: a.id === id })));
  };

  const openEdit = (a) => { setEditId(a.id); setForm({ ...a }); setShowForm(true); };

  if (!loadDone) return null;

  return (
    <div style={{ background:"#fff", borderRadius:14, padding:24, boxShadow:"var(--sh)" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <h3 style={{ fontFamily:"Cormorant Garamond,serif", fontSize:"1.2rem" }}>
          Saved Addresses
          {addresses.length > 0 && <span style={{ fontWeight:400, color:"var(--mt)", fontSize:"1rem", marginLeft:8 }}>({addresses.length})</span>}
        </h3>
        <button onClick={() => { setShowForm(v => !v); if (showForm) { setEditId(null); setForm(BLANK_ADDR); } }}
          style={{ background:"none", border:"1px solid var(--bd)", borderRadius:8, padding:"5px 14px",
            cursor:"pointer", fontSize:".82rem", color:"var(--mt)", fontFamily:"DM Sans,sans-serif" }}>
          {showForm && !editId ? "Cancel" : "+ Add New"}
        </button>
      </div>

      {showForm && (
        <AddrForm form={form} onChange={(k,v) => setForm(f => ({...f,[k]:v}))}
          onSave={saveAddress} onCancel={() => { setShowForm(false); setEditId(null); setForm(BLANK_ADDR); }}
          saving={saving} editId={editId}/>
      )}

      {!showForm && addresses.length === 0 && (
        <div style={{ textAlign:"center", padding:"40px 0", color:"var(--mt)" }}>
          <div style={{ fontSize:"2.5rem", marginBottom:10 }}>📍</div>
          <p style={{ fontSize:".88rem", marginBottom:14 }}>Save your addresses to speed up checkout</p>
          <button className="btn-sf" style={{ padding:"8px 20px", fontSize:".88rem", borderRadius:10 }}
            onClick={() => setShowForm(true)}>+ Add Address</button>
        </div>
      )}

      {addresses.length > 0 && (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {addresses.map(a => (
            <div key={a.id} style={{ border:`1.5px solid ${a.isDefault ? "var(--sf)" : "var(--bd)"}`,
              borderRadius:12, padding:"14px 16px", background: a.isDefault ? "#FFF8F3" : "#fff", transition:"border-color .2s" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                <span style={{ fontWeight:700, fontSize:".9rem" }}>
                  {ADDR_ICONS[a.label] || "📍"} {a.label}
                </span>
                {a.isDefault && (
                  <span style={{ fontSize:".7rem", background:"var(--sf)", color:"#fff", padding:"2px 10px", borderRadius:10, fontWeight:700 }}>Default</span>
                )}
              </div>
              <div style={{ fontSize:".85rem", color:"var(--dk)", marginBottom:2 }}>
                <strong>{a.name}</strong>{a.phone ? ` · ${a.phone}` : ""}
              </div>
              <div style={{ fontSize:".82rem", color:"var(--mt)" }}>
                {[a.line1, a.city, a.state].filter(Boolean).join(", ")}{a.pin ? ` – ${a.pin}` : ""}
              </div>
              {a.email && <div style={{ fontSize:".78rem", color:"var(--mt)", marginTop:2 }}>{a.email}</div>}
              <div style={{ display:"flex", gap:8, marginTop:10, flexWrap:"wrap" }}>
                {!a.isDefault && <button style={OB} onClick={() => setDefault(a.id)}>Set Default</button>}
                <button style={OB} onClick={() => openEdit(a)}>Edit</button>
                <button style={DB} onClick={() => deleteAddr(a.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PaymentSection({ uid }) {
  const [methods, setMethods]   = useState([]);
  const [loadDone, setLoadDone] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(BLANK_PAY);
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    getDoc(doc(db, "users", uid)).then(snap => {
      setMethods(snap.exists() ? snap.data().paymentMethods || [] : []);
      setLoadDone(true);
    }).catch(() => setLoadDone(true));
  }, [uid]);

  const persist = async (list) => {
    setMethods(list);
    await updateDoc(doc(db, "users", uid), { paymentMethods: list });
  };

  const ensureDefault = (list) => {
    if (list.length === 0 || list.some(p => p.isDefault)) return list;
    return list.map((p, i) => ({ ...p, isDefault: i === 0 }));
  };

  const saveMethod = async () => {
    setSaving(true);
    const id = addrUid();
    let updated = [...methods, { ...form, id }];
    if (form.isDefault || methods.length === 0) updated = updated.map(p => ({ ...p, isDefault: p.id === id }));
    updated = ensureDefault(updated);
    await persist(updated);
    setShowForm(false); setForm(BLANK_PAY); setSaving(false);
  };

  const deleteMethod = async (id) => {
    await persist(ensureDefault(methods.filter(p => p.id !== id)));
  };

  const setDefault = async (id) => {
    await persist(methods.map(p => ({ ...p, isDefault: p.id === id })));
  };

  const labelSt = { fontSize:".75rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", color:"#6B4C38", display:"block", marginBottom:5 };
  const inputSt = { width:"100%", padding:"9px 12px", border:"1.5px solid var(--bd)", borderRadius:9, fontSize:".88rem", fontFamily:"DM Sans,sans-serif", outline:"none", boxSizing:"border-box" };

  if (!loadDone) return null;

  return (
    <div style={{ background:"#fff", borderRadius:14, padding:24, boxShadow:"var(--sh)" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <h3 style={{ fontFamily:"Cormorant Garamond,serif", fontSize:"1.2rem" }}>
          Payment Methods
          {methods.length > 0 && <span style={{ fontWeight:400, color:"var(--mt)", fontSize:"1rem", marginLeft:8 }}>({methods.length})</span>}
        </h3>
        <button onClick={() => { setShowForm(v => !v); setForm(BLANK_PAY); }}
          style={{ background:"none", border:"1px solid var(--bd)", borderRadius:8, padding:"5px 14px",
            cursor:"pointer", fontSize:".82rem", color:"var(--mt)", fontFamily:"DM Sans,sans-serif" }}>
          {showForm ? "Cancel" : "+ Add New"}
        </button>
      </div>

      {showForm && (
        <div style={{ background:"#FFF8F3", border:"1.5px solid var(--bd)", borderRadius:12, padding:20, marginBottom:16 }}>
          <div style={{ fontWeight:700, fontSize:".9rem", color:"var(--dk)", marginBottom:14 }}>Add Payment Method</div>
          <div style={{ marginBottom:14 }}>
            <span style={labelSt}>Type</span>
            <div style={{ display:"flex", gap:8 }}>
              {[["upi","📱 UPI"],["card","💳 Card / Bank"]].map(([t,l]) => (
                <button key={t} type="button" onClick={() => setForm(f => ({...f, type:t}))}
                  style={{ padding:"6px 18px", borderRadius:20, border:"1.5px solid",
                    borderColor: form.type === t ? "var(--sf)" : "var(--bd)",
                    background: form.type === t ? "var(--sf)" : "#fff",
                    color: form.type === t ? "#fff" : "var(--mt)",
                    fontSize:".84rem", fontWeight:600, cursor:"pointer", fontFamily:"DM Sans,sans-serif" }}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
            <div><label style={labelSt}>Label (e.g. PhonePe)</label>
              <input style={inputSt} placeholder={form.type === "upi" ? "PhonePe" : "HDFC Visa"}
                value={form.label} onChange={e => setForm(f => ({...f,label:e.target.value}))}/></div>
            {form.type === "upi"
              ? <div><label style={labelSt}>UPI ID *</label>
                  <input style={inputSt} placeholder="yourname@upi"
                    value={form.upiId} onChange={e => setForm(f => ({...f,upiId:e.target.value}))}/></div>
              : <div><label style={labelSt}>Card / Bank *</label>
                  <input style={inputSt} placeholder="HDFC Visa ****4567"
                    value={form.cardDisplay} onChange={e => setForm(f => ({...f,cardDisplay:e.target.value}))}/></div>
            }
          </div>
          <label style={{ display:"flex", alignItems:"center", gap:8, fontSize:".85rem", marginBottom:16, cursor:"pointer" }}>
            <input type="checkbox" checked={form.isDefault} onChange={e => setForm(f => ({...f,isDefault:e.target.checked}))}/>
            Set as default payment method
          </label>
          <div style={{ display:"flex", gap:8 }}>
            <button className="btn-sf" style={{ padding:"9px 22px", borderRadius:10, fontSize:".88rem" }}
              onClick={saveMethod}
              disabled={saving || !((form.type==="upi" && form.upiId) || (form.type==="card" && form.cardDisplay))}>
              {saving ? "Saving…" : "Save Method"}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setForm(BLANK_PAY); }}
              style={{ padding:"9px 18px", border:"1.5px solid var(--bd)", background:"none", borderRadius:10,
                cursor:"pointer", fontSize:".88rem", color:"var(--mt)", fontFamily:"DM Sans,sans-serif" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {!showForm && methods.length === 0 && (
        <div style={{ textAlign:"center", padding:"40px 0", color:"var(--mt)" }}>
          <div style={{ fontSize:"2.5rem", marginBottom:10 }}>💳</div>
          <p style={{ fontSize:".88rem", marginBottom:14 }}>Save your UPI or card details for faster checkout</p>
          <button className="btn-sf" style={{ padding:"8px 20px", fontSize:".88rem", borderRadius:10 }}
            onClick={() => setShowForm(true)}>+ Add Payment Method</button>
        </div>
      )}

      {methods.length > 0 && (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {methods.map(p => (
            <div key={p.id} style={{ border:`1.5px solid ${p.isDefault ? "var(--sf)" : "var(--bd)"}`,
              borderRadius:12, padding:"14px 16px", background: p.isDefault ? "#FFF8F3" : "#fff", transition:"border-color .2s" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                <span style={{ fontSize:"1.1rem" }}>{p.type === "upi" ? "📱" : "💳"}</span>
                <span style={{ fontWeight:700, fontSize:".9rem" }}>{p.label || (p.type === "upi" ? "UPI" : "Card")}</span>
                {p.isDefault && (
                  <span style={{ fontSize:".7rem", background:"var(--sf)", color:"#fff", padding:"2px 10px", borderRadius:10, fontWeight:700 }}>Default</span>
                )}
              </div>
              <div style={{ fontSize:".83rem", color:"var(--mt)", fontFamily:"monospace", letterSpacing:".04em" }}>
                {p.type === "upi" ? p.upiId : p.cardDisplay}
              </div>
              <div style={{ display:"flex", gap:8, marginTop:10 }}>
                {!p.isDefault && <button style={OB} onClick={() => setDefault(p.id)}>Set Default</button>}
                <button style={DB} onClick={() => deleteMethod(p.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const STATUS_COLOR = {
  Delivered: { bg:"#E8F5EC", color:"#2D7D46" },
  Shipped:   { bg:"#EAF2FF", color:"#1A5276" },
  Processing:{ bg:"#FFF3DC", color:"#B7770D" },
  Cancelled: { bg:"#FDECEA", color:"#C0392B" },
};
const RETURN_COLOR = {
  Pending:   { bg:"#FFF3DC", color:"#B7770D" },
  Approved:  { bg:"#E8F5EC", color:"#2D7D46" },
  Rejected:  { bg:"#FDECEA", color:"#C0392B" },
  Completed: { bg:"#EAF2FF", color:"#1A5276" },
};

const NAV_TABS = [
  { id:"overview",       icon:"👤", label:"Overview" },
  { id:"notifications",  icon:"🔔", label:"Notifications" },
  { id:"wallet",         icon:"💰", label:"Wallet" },
  { id:"orders",         icon:"📦", label:"Orders" },
  { id:"addresses",      icon:"📍", label:"Addresses" },
  { id:"payment",        icon:"💳", label:"Payment" },
  { id:"support",        icon:"💬", label:"Support" },
  { id:"wishlist",       icon:"♡",  label:"Wishlist" },
  { id:"room",           icon:"🏠", label:"Room Designs" },
  { id:"security",       icon:"🔒", label:"Security" },
];

const NOTIF_TYPE = {
  order:        { icon:"📦", color:"#1565C0", bg:"#E3F2FD",  label:"Order" },
  support:      { icon:"💬", color:"#6A1B9A", bg:"#F3E5F5",  label:"Support" },
  promo:        { icon:"🎁", color:"#2D7D46", bg:"#E8F5E9",  label:"Promo" },
  alert:        { icon:"⚠️", color:"#B7770D", bg:"#FFF3DC",  label:"Alert" },
  info:         { icon:"ℹ️", color:"#1A5276", bg:"#EAF2FF",  label:"Info" },
  payment:      { icon:"💳", color:"#1A237E", bg:"#E8EAF6",  label:"Payment" },
  refund:       { icon:"💰", color:"#00695C", bg:"#E0F2F1",  label:"Refund" },
  exchange:     { icon:"🔄", color:"#4E342E", bg:"#EFEBE9",  label:"Exchange" },
  announcement: { icon:"📢", color:"#C62828", bg:"#FFEBEE",  label:"Announcement" },
  welcome:      { icon:"🎉", color:"#E65100", bg:"#FFF3E0",  label:"Welcome" },
};

export default function ProfilePage({ user, setUser, setPage, products = [], onOpen, roomBuilderEnabled = true }) {
  const [tab, setTab]           = useState("overview");
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletTxns, setWalletTxns]       = useState([]);
  const [walletTxnFilter, setWalletTxnFilter] = useState("all");
  const [walletTxnPage,   setWalletTxnPage]   = useState(0);
  const [rechargeOpen, setRechargeOpen]   = useState(false);
  const [rechargeAmt, setRechargeAmt]     = useState("");
  const [rechargePaying, setRechargePaying] = useState(false);
  const [rzpOpen, setRzpOpen] = useState(false);
  const [notifs, setNotifs]           = useState([]);
  const [notifFilter, setNotifFilter] = useState("all");
  const [myTickets, setMyTickets]     = useState([]);
  const [selTicketId, setSelTicketId] = useState(null);
  const [liveTicket, setLiveTicket]   = useState(null);
  const [replyText, setReplyText]     = useState("");
  const [replyImages, setReplyImages] = useState([]);   // [{url, name}]
  const [replyUploading, setReplyUploading] = useState(false);
  const [replySending, setReplySending]     = useState(false);
  const supportThreadRef = useRef(null);
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [invoice, setInvoice]   = useState(null);
  const [returnOrder, setReturnOrder]   = useState(null);
  const [trackReturn, setTrackReturn]   = useState(null);
  const [pwOpen, setPwOpen]       = useState(false);
  const [pw, setPw]               = useState({current:"", next:"", confirm:""});
  const [pwError, setPwError]         = useState("");
  const [pwSuccess, setPwSuccess]     = useState("");
  const [pwSaving, setPwSaving]       = useState(false);
  const [showPw, setShowPw]           = useState({current:false, next:false, confirm:false});
  const [pwOtpStep, setPwOtpStep]     = useState(false);
  const [providers, setProviders]     = useState(() => getLinkedProviders());
  const [unlinkBusy, setUnlinkBusy]   = useState(false);
  const [unlinkError, setUnlinkError] = useState("");
  const [pwPendingOtp, setPwPendingOtp] = useState("");
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelOtp, setCancelOtp]       = useState("");
  const [cancelSending, setCancelSending] = useState(false);
  const [cancelError, setCancelError]   = useState("");
  const [editName, setEditName] = useState(false);
  const [nameVal, setNameVal]   = useState(user?.name || "");
  const [savingName, setSavingName] = useState(false);
  const [wishlistIds, setWishlistIds] = useState(() => getWishlistIds());
  const [ordersPage, setOrdersPage] = useState(1);
  const ORDERS_PER_PAGE = 5;
  const [roomDesigns, setRoomDesigns] = useState([]);
  const [roomDesignsLoading, setRoomDesignsLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeOrdersByUser(user.uid, user.email, o => {
      setOrders(o);
      setLoading(false);
    });
    return unsub;
  }, [user?.uid, user?.email]);

  useEffect(() => {
    const sync = () => setWishlistIds(getWishlistIds());
    window.addEventListener("ts-wishlist-change", sync);
    return () => window.removeEventListener("ts-wishlist-change", sync);
  }, []);

  // Subscribe to wallet
  useEffect(() => {
    if (!user?.uid) return;
    const u1 = subscribeWalletBalance(user.uid, setWalletBalance);
    const u2 = subscribeWalletTxns(user.uid, setWalletTxns);
    return () => { u1(); u2(); };
  }, [user?.uid]);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeUserNotifs(user.uid, setNotifs);
    return unsub;
  }, [user?.uid]);

  // Subscribe to this customer's support tickets (list)
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeUserTickets(user.uid, setMyTickets);
    return unsub;
  }, [user?.uid]);

  // Direct per-document subscription for the open chat — gives instant real-time updates
  useEffect(() => {
    if (!selTicketId) { setLiveTicket(null); return; }
    const unsub = subscribeTicket(selTicketId, setLiveTicket);
    return unsub;
  }, [selTicketId]);

  // Mark ticket as customer-read when opened
  useEffect(() => {
    if (selTicketId) markCustomerRead(selTicketId);
  }, [selTicketId]);

  // Load room designs when the tab opens
  useEffect(() => {
    if (tab === "room" && user?.uid) {
      setRoomDesignsLoading(true);
      getUserDesigns(user.uid).then(d => { setRoomDesigns(d); setRoomDesignsLoading(false); }).catch(() => setRoomDesignsLoading(false));
    }
  }, [tab, user?.uid]);

  // Redirect away if Room Builder gets disabled while this tab is open
  useEffect(() => {
    if (tab === "room" && !roomBuilderEnabled) setTab("overview");
  }, [tab, roomBuilderEnabled]);

  // Auto-select most recent active ticket whenever the support tab opens (survives refresh)
  useEffect(() => {
    if (tab === "support" && myTickets.length > 0 && !selTicketId) {
      const active = myTickets.find(t => t.status === "open" || t.status === "in-progress") || myTickets[0];
      setSelTicketId(active.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, myTickets.length]);

  // Auto-scroll when a new message arrives in the live ticket
  useEffect(() => {
    if (supportThreadRef.current) {
      supportThreadRef.current.scrollTop = supportThreadRef.current.scrollHeight;
    }
  }, [liveTicket?.replies?.length]);

  // Allow Nav bell click to switch to notifications tab
  useEffect(() => {
    const handler = (e) => setTab(e.detail || "notifications");
    window.addEventListener("ts-profile-tab", handler);
    return () => window.removeEventListener("ts-profile-tab", handler);
  }, []);

  // Auto-mark support-type notifications as read when the customer views the Support tab.
  // (The Notifications tab intentionally does NOT bulk-mark-as-read on open — it has its own
  // Unread/All filter and per-item click-to-read, plus an explicit "Mark all read" button.)
  useEffect(() => {
    if (!user?.uid || !notifs.length) return;
    if (tab === "support") {
      const unreadSupport = notifs.filter(n => n.type === "support" && !isNotifRead(n, user.uid));
      unreadSupport.forEach(n => markRead(n.id, user.uid, n.userId === "all"));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, notifs]);

  // Reset reply form when switching tickets
  useEffect(() => { setReplyText(""); setReplyImages([]); }, [selTicketId]);


  if (!user) { setPage("home"); return null; }

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setPage("home");
  };

  const saveName = async () => {
    if (!nameVal.trim()) return;
    setSavingName(true);
    await updateDoc(doc(db, "users", user.uid), { name: nameVal.trim() });
    setUser(u => ({ ...u, name: nameVal.trim() }));
    setEditName(false);
    setSavingName(false);
  };

  const handleChangePassword = async () => {
    setPwError(""); setPwSuccess("");
    if (!pw.current) { setPwError("Enter your current password."); return; }
    if (pw.next.length < 6) { setPwError("New password must be at least 6 characters."); return; }
    if (pw.next !== pw.confirm) { setPwError("New passwords do not match."); return; }
    setPwSaving(true);
    try {
      const code = generateOtp();
      await sendOtp(user.email, code, "Change Password");
      setPwPendingOtp(code);
      setPwOtpStep(true);
    } catch (err) {
      setPwError(err.message || "Failed to send verification email. Please try again.");
    } finally {
      setPwSaving(false);
    }
  };

  const handlePwOtpVerify = async (entered) => {
    if (entered !== pwPendingOtp) throw new Error("Invalid OTP. Please try again.");
    await changePassword(pw.current, pw.next);
    sendConfirmationEmail(
      user.email,
      "Your password has been changed",
      `Hi ${user.name || "there"},\n\nYour Telugu Seemalo account password was changed successfully on ${new Date().toLocaleString("en-IN")}.\n\nIf you did not make this change, please contact us immediately.`
    ).catch(() => {});
    setPwOtpStep(false);
    setPwPendingOtp("");
    setPwSuccess("Password changed successfully! A confirmation has been sent to your email.");
    setPw({current:"", next:"", confirm:""});
    setTimeout(() => { setPwOpen(false); setPwSuccess(""); }, 3000);
  };

  const handlePwOtpResend = async () => {
    const code = generateOtp();
    await sendOtp(user.email, code, "Change Password");
    setPwPendingOtp(code);
  };

  const toggle = (docId) => setExpanded(e => e === docId ? null : docId);

  const handleCancelRequest = async (order) => {
    setCancelError("");
    setCancelSending(true);
    try {
      const code = generateOtp();
      await sendOtp(user.email, code, "Cancel Order");
      setCancelOtp(code);
      setCancelTarget(order);
    } catch (e) {
      setCancelError(e.message);
    } finally {
      setCancelSending(false);
    }
  };

  const handleCancelVerify = async (entered) => {
    if (entered !== cancelOtp) throw new Error("Invalid OTP. Please try again.");
    await cancelOrder(cancelTarget.docId);
    notifyOrderCancelled(cancelTarget, user.email);
    if (cancelTarget.razorpayPaymentId) {
      callProcessRefund({ paymentId: cancelTarget.razorpayPaymentId }).catch(err =>
        console.error("Refund failed:", err)
      );
    }
    setOrders(prev => prev.map(o => o.docId === cancelTarget.docId ? { ...o, status: "Cancelled" } : o));
    setCancelTarget(null);
    setCancelOtp("");
  };

  const handleCancelResend = async () => {
    const code = generateOtp();
    await sendOtp(user.email, code, "Cancel Order");
    setCancelOtp(code);
  };

  const handleSupportImages = async (files) => {
    const arr = Array.from(files).slice(0, 5 - replyImages.length);
    if (!arr.length) return;
    setReplyUploading(true);
    try {
      const urls = await Promise.all(arr.map(f => uploadSupportAttachment(f)));
      setReplyImages(prev => [...prev, ...urls.map((url, i) => ({ url, name: arr[i].name }))]);
    } catch {
      // upload error — silently ignore individual failures
    } finally {
      setReplyUploading(false);
    }
  };

  const handleSendReply = async () => {
    if ((!replyText.trim() && replyImages.length === 0) || replySending || !liveTicket) return;
    setReplySending(true);
    const msg = {
      id:        Date.now().toString(36),
      from:      "customer",
      name:      user.name || user.email,
      message:   replyText.trim(),
      images:    replyImages.map(i => i.url),
      createdAt: new Date().toISOString(),
    };
    await addReply(liveTicket.id, msg);
    setReplyText("");
    setReplyImages([]);
    setReplySending(false);
  };

  const initials = (user.name || user.email || "U").slice(0, 2).toUpperCase();

  return (
    <>
      <style>{`
        .prof-wrap{display:grid;grid-template-columns:220px 1fr;min-height:calc(100vh - 130px);}
        .prof-sidebar{background:#fff;border-right:1px solid #EDE5DA;position:sticky;top:70px;height:calc(100vh - 130px);overflow-y:auto;padding:12px 0;align-self:start;}
        .prof-content{padding:28px 32px;background:#F8F4F0;min-height:calc(100vh - 130px);}
        .prof-tab-btn{display:flex;align-items:center;gap:12px;width:100%;padding:13px 24px;background:none;border:none;border-left:3px solid transparent;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:.88rem;font-weight:400;color:var(--dk);text-align:left;transition:background .15s,color .15s;}
        .prof-tab-btn.pact{background:#FFF8F3;border-left-color:var(--sf);font-weight:700;color:var(--sf);}
        .prof-tab-btn:hover:not(.pact){background:#FDFAF7;}
        .prof-badge{margin-left:auto;font-size:.7rem;background:#F0EAE2;color:var(--mt);padding:2px 8px;border-radius:20;border-radius:12px;}
        .prof-stat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:24px;}
        .prof-stat-card{background:#fff;border-radius:12px;padding:18px 14px;box-shadow:var(--sh);text-align:center;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;transition:transform .15s,box-shadow .15s;width:100%;}
        .prof-stat-card:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,.1);}
        @media(max-width:700px){
          .prof-wrap{grid-template-columns:1fr;}
          .prof-sidebar{position:static;height:auto;display:flex;flex-direction:row;overflow-x:auto;border-right:none;border-bottom:1px solid #EDE5DA;padding:0;top:0;}
          .prof-tab-btn{width:auto;padding:12px 16px;border-left:none;border-bottom:3px solid transparent;white-space:nowrap;flex-shrink:0;}
          .prof-tab-btn.pact{border-left:none;border-bottom-color:var(--sf);}
          .prof-content{padding:16px;}
          .prof-stat-grid{grid-template-columns:repeat(2,1fr);}
        }
      `}</style>

      {/* ── Profile header ── */}
      <div style={{background:"linear-gradient(135deg,#2C1A0E,#4A2C1A)",padding:"28px 36px",display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
        <div style={{width:68,height:68,borderRadius:"50%",background:"var(--sf)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.4rem",fontWeight:700,color:"#fff",flexShrink:0,border:"3px solid rgba(255,255,255,.2)",letterSpacing:".05em"}}>
          {initials}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <h2 style={{fontFamily:"Cormorant Garamond,serif",fontSize:"1.6rem",fontWeight:700,color:"#fff",margin:0,lineHeight:1.1}}>
            {user.name || "My Account"}
          </h2>
          <div style={{color:"rgba(255,255,255,.65)",fontSize:".84rem",marginTop:3}}>{user.email}</div>
          <div style={{marginTop:8,display:"inline-block",background:user.role==="admin"?"var(--sf)":"rgba(255,255,255,.18)",color:"#fff",fontSize:".7rem",fontWeight:700,padding:"3px 12px",borderRadius:20,textTransform:"uppercase",letterSpacing:".07em"}}>
            {user.role || "Customer"}
          </div>
        </div>
        <button onClick={handleLogout}
          style={{background:"rgba(255,255,255,.12)",border:"1px solid rgba(255,255,255,.25)",color:"rgba(255,255,255,.85)",borderRadius:9,padding:"8px 20px",cursor:"pointer",fontSize:".84rem",fontFamily:"DM Sans,sans-serif",flexShrink:0}}>
          Logout
        </button>
      </div>

      {/* ── Two-column body ── */}
      <div className="prof-wrap">

        {/* Sidebar */}
        <nav className="prof-sidebar">
          {NAV_TABS.filter(t => t.id !== "room" || roomBuilderEnabled).map(t => (
            <button key={t.id} className={`prof-tab-btn${tab===t.id?" pact":""}`} onClick={() => setTab(t.id)}>
              <span style={{fontSize:"1rem"}}>{t.icon}</span>
              {t.label}
              {t.id==="notifications" && notifs.filter(n=>!isNotifRead(n,user.uid)).length > 0 && (
                <span className="prof-badge" style={{background:"#E8620A",color:"#fff"}}>{notifs.filter(n=>!isNotifRead(n,user.uid)).length}</span>
              )}
              {t.id==="wallet" && walletBalance > 0 && (
                <span className="prof-badge" style={{background:"#2D7D46",color:"#fff",fontSize:".65rem"}}>₹{walletBalance % 1 === 0 ? walletBalance : walletBalance.toFixed(2)}</span>
              )}
              {t.id==="orders" && !loading && orders.length > 0 && <span className="prof-badge">{orders.length}</span>}
              {t.id==="wishlist" && wishlistIds.length > 0 && <span className="prof-badge">{wishlistIds.length}</span>}
              {t.id==="support" && (() => {
                const unreadSupport = myTickets.filter(ticket => {
                  const replies = ticket.replies || [];
                  if (!replies.length) return false;
                  return replies[replies.length - 1].from === "admin" && !ticket.customerRead;
                }).length;
                return unreadSupport > 0
                  ? <span className="prof-badge" style={{background:"#6A1B9A",color:"#fff"}}>{unreadSupport}</span>
                  : null;
              })()}
            </button>
          ))}
        </nav>

        {/* Content */}
        <main className="prof-content">

          {/* ── Overview ── */}
          {tab === "overview" && (
            <div>
              <div className="prof-stat-grid" style={{gridTemplateColumns:"repeat(4,1fr)"}}>
                {[
                  {icon:"📦",label:"Total Orders",     value: loading ? "…" : orders.length, dest:"orders"},
                  {icon:"💰",label:"Wallet Balance",   value: fmt(walletBalance),             dest:"wallet"},
                  {icon:"♡", label:"Wishlist Items",   value: wishlistIds.length,            dest:"wishlist"},
                  {icon:"🔔",label:"Unread Notifs",    value: notifs.filter(n=>!isNotifRead(n,user.uid)).length || "—", dest:"notifications"},
                ].map(s => (
                  <button key={s.label} className="prof-stat-card" onClick={() => setTab(s.dest)}>
                    <div style={{fontSize:"1.6rem",marginBottom:8}}>{s.icon}</div>
                    <div style={{fontSize:"1.5rem",fontWeight:700,color:"var(--dk)",lineHeight:1}}>{s.value}</div>
                    <div style={{fontSize:".75rem",color:"var(--mt)",marginTop:4}}>{s.label}</div>
                  </button>
                ))}
              </div>

              <div style={{background:"#fff",borderRadius:14,padding:24,boxShadow:"var(--sh)"}}>
                <h3 style={{fontFamily:"Cormorant Garamond,serif",fontSize:"1.2rem",marginBottom:16}}>Account Details</h3>
                <div style={{display:"flex",flexDirection:"column",gap:0}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid var(--bd)"}}>
                    <span style={{color:"var(--mt)",fontSize:".9rem"}}>Name</span>
                    {editName ? (
                      <div style={{display:"flex",gap:8,alignItems:"center"}}>
                        <input value={nameVal} onChange={e=>setNameVal(e.target.value)}
                          style={{padding:"5px 10px",border:"1.5px solid var(--bd)",borderRadius:7,fontSize:".9rem",fontFamily:"DM Sans,sans-serif",outline:"none",width:180}}
                          onKeyDown={e=>e.key==="Enter"&&saveName()}
                          autoFocus/>
                        <button className="btn-sf" style={{padding:"5px 14px",fontSize:".82rem",borderRadius:8}} onClick={saveName} disabled={savingName}>
                          {savingName?"…":"Save"}
                        </button>
                        <button onClick={()=>{setEditName(false);setNameVal(user.name);}}
                          style={{background:"none",border:"none",cursor:"pointer",color:"var(--mt)",fontSize:".82rem"}}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div style={{display:"flex",alignItems:"center",gap:12}}>
                        <span style={{fontWeight:600}}>{user.name}</span>
                        <button onClick={()=>setEditName(true)}
                          style={{background:"none",border:"1px solid var(--bd)",borderRadius:6,padding:"3px 10px",cursor:"pointer",fontSize:".75rem",color:"var(--mt)"}}>
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid var(--bd)"}}>
                    <span style={{color:"var(--mt)",fontSize:".9rem"}}>Email</span>
                    <span style={{fontWeight:600,fontSize:".9rem"}}>{user.email}</span>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0"}}>
                    <span style={{color:"var(--mt)",fontSize:".9rem"}}>Account type</span>
                    <span style={{fontWeight:600,fontSize:".9rem",color:user.role==="admin"?"#E8620A":"var(--mt)",textTransform:"capitalize"}}>{user.role||"Customer"}</span>
                  </div>
                </div>
                <div style={{display:"flex",gap:10,marginTop:16,flexWrap:"wrap"}}>
                  <button className="btn-sf" style={{padding:"8px 18px",borderRadius:10,fontSize:".88rem"}} onClick={()=>setPage("track")}>
                    📦 Track an Order
                  </button>
                  <button className="btn-sf" style={{background:"none",border:"1.5px solid var(--bd)",color:"var(--mt)",padding:"8px 18px",borderRadius:10,fontSize:".88rem"}} onClick={()=>setTab("security")}>
                    🔒 Change Password
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Notifications ── */}
          {tab === "notifications" && (() => {
            const unread  = notifs.filter(n => !isNotifRead(n, user.uid));
            const visible = notifFilter === "unread" ? unread : notifs;

            const fmtTs = (ts) => {
              if (!ts) return "";
              const d = ts.toDate ? ts.toDate() : new Date(ts);
              const diff = Date.now() - d;
              if (diff < 60000)    return "just now";
              if (diff < 3600000)  return `${Math.floor(diff / 60000)}m ago`;
              if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
              if (diff < 604800000) return d.toLocaleDateString("en-IN", { weekday:"short", day:"numeric", month:"short" });
              return d.toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }) +
                     " · " + d.toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" });
            };

            return (
              <div>
                {/* Header row */}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:10}}>
                  <h3 style={{fontFamily:"Cormorant Garamond,serif",fontSize:"1.2rem",margin:0}}>
                    Notification History
                  </h3>
                  <div style={{display:"flex",gap:8}}>
                    {unread.length > 0 && (
                      <button onClick={() => markAllRead(notifs, user.uid)}
                        style={{background:"none",border:"1px solid var(--bd)",borderRadius:8,padding:"5px 14px",
                          cursor:"pointer",fontSize:".78rem",color:"var(--mt)",fontFamily:"DM Sans,sans-serif"}}>
                        Mark all read
                      </button>
                    )}
                    {notifs.length > 0 && (
                      <button
                        onClick={() => notifs.forEach(n => dismissNotif(n.id, user.uid, n.userId === "all"))}
                        style={{background:"none",border:"1px solid #FADBD8",borderRadius:8,padding:"5px 14px",
                          cursor:"pointer",fontSize:".78rem",color:"#C0392B",fontFamily:"DM Sans,sans-serif"}}>
                        Clear all
                      </button>
                    )}
                  </div>
                </div>

                {/* Filter tabs + summary */}
                <div style={{display:"flex",alignItems:"center",gap:0,marginBottom:16,background:"#fff",
                  borderRadius:10,boxShadow:"var(--sh)",padding:4,width:"fit-content"}}>
                  {[
                    { id:"all",    label:`All (${notifs.length})` },
                    { id:"unread", label:`Unread (${unread.length})` },
                  ].map(f => (
                    <button key={f.id} onClick={() => setNotifFilter(f.id)}
                      style={{padding:"6px 18px",borderRadius:8,border:"none",cursor:"pointer",
                        fontFamily:"DM Sans,sans-serif",fontSize:".82rem",fontWeight: notifFilter===f.id ? 700 : 400,
                        background: notifFilter===f.id ? "var(--sf)" : "none",
                        color: notifFilter===f.id ? "#fff" : "var(--mt)",
                        transition:"all .15s"}}>
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Empty state */}
                {visible.length === 0 ? (
                  <div style={{background:"#fff",borderRadius:14,padding:"50px 20px",textAlign:"center",boxShadow:"var(--sh)"}}>
                    <div style={{fontSize:"2.5rem",marginBottom:12}}>{notifFilter==="unread" ? "✅" : "🔔"}</div>
                    <p style={{color:"var(--mt)",fontSize:".9rem"}}>
                      {notifFilter === "unread"
                        ? "You're all caught up! No unread notifications."
                        : "No notifications yet. Order updates and support replies will appear here."}
                    </p>
                    {notifFilter === "unread" && notifs.length > 0 && (
                      <button onClick={() => setNotifFilter("all")}
                        style={{marginTop:12,background:"none",border:"1px solid var(--bd)",borderRadius:8,
                          padding:"6px 16px",cursor:"pointer",fontSize:".82rem",color:"var(--mt)",fontFamily:"DM Sans,sans-serif"}}>
                        View all history ({notifs.length})
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {visible.map(n => {
                      const nt  = NOTIF_TYPE[n.type] || NOTIF_TYPE.info;
                      const read = isNotifRead(n, user.uid);
                      return (
                        <div key={n.id}
                          onClick={() => {
                            if (!read) markRead(n.id, user.uid, n.userId === "all");
                            if (n.link === "orders")       setTab("orders");
                            else if (n.link === "support")  setTab("support");
                            else if (n.link === "wallet")   setTab("wallet");
                            else if (n.link === "contact")  setPage("contact");
                          }}
                          style={{background:"#fff",borderRadius:12,padding:"14px 16px",
                            boxShadow:"var(--sh)",display:"flex",alignItems:"flex-start",gap:14,
                            borderLeft:`4px solid ${read ? "#EDE5DA" : nt.color}`,
                            opacity: read ? 0.72 : 1,
                            cursor: (n.link || !read) ? "pointer" : "default",
                            transition:"opacity .2s,border-color .2s"}}>
                          {/* Icon */}
                          <div style={{width:40,height:40,borderRadius:"50%",background: read ? "#F4F0EC" : nt.bg,
                            display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.1rem",flexShrink:0,
                            transition:"background .2s"}}>
                            {nt.icon}
                          </div>
                          {/* Body */}
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{display:"flex",alignItems:"flex-start",gap:8,marginBottom:3}}>
                              <span style={{fontWeight: read ? 400 : 700,fontSize:".9rem",color:"var(--dk)",lineHeight:1.3,flex:1}}>
                                {n.title}
                              </span>
                              {!read && <span style={{width:8,height:8,borderRadius:"50%",background:"#E8620A",flexShrink:0,marginTop:5}}/>}
                            </div>
                            <p style={{fontSize:".82rem",color:"var(--mt)",margin:"0 0 6px",lineHeight:1.45}}>{n.message}</p>
                            <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                              <span style={{fontSize:".72rem",color:"#9B8472"}}>{fmtTs(n.createdAt)}</span>
                              <span style={{fontSize:".7rem",background: read ? "#F4F0EC" : nt.bg,
                                color: read ? "#9B8472" : nt.color,
                                padding:"1px 8px",borderRadius:10,fontWeight:600}}>
                                {nt.icon} {nt.label || n.type || "info"}
                              </span>
                              {n.link && (
                                <span style={{fontSize:".7rem",color:"var(--sf)",fontWeight:600}}>
                                  {n.link === "orders" ? "→ View orders" : n.link === "support" ? "→ View ticket" : n.link === "wallet" ? "→ View wallet" : n.link ? `→ ${n.link}` : ""}
                                </span>
                              )}
                            </div>
                          </div>
                          {/* Dismiss button — always visible */}
                          <button
                            onClick={e => { e.stopPropagation(); dismissNotif(n.id, user.uid, n.userId === "all"); }}
                            style={{background:"none",border:"none",cursor:"pointer",color:"#C0392B",
                              fontSize:"1.1rem",padding:"2px 6px",flexShrink:0,lineHeight:1,
                              opacity:.35,transition:"opacity .15s"}}
                            onMouseEnter={e=>e.currentTarget.style.opacity=1}
                            onMouseLeave={e=>e.currentTarget.style.opacity=.35}
                            title="Dismiss">×</button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* ── Wallet ── */}
          {tab === "wallet" && (() => {
            const fmtTs = (ts) => {
              if (!ts) return "";
              const d = ts.toDate ? ts.toDate() : new Date(ts);
              const diff = Date.now() - d;
              if (diff < 60000)    return "just now";
              if (diff < 3600000)  return `${Math.floor(diff/60000)}m ago`;
              if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`;
              if (diff < 604800000) return d.toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"});
              return d.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});
            };
            const SOURCE_LABEL = { recharge:"Recharge", refund:"Refund", cashback:"Cashback", checkout:"Order Payment", admin:"Admin Credit" };
            const filtered = walletTxnFilter === "all" ? walletTxns
              : walletTxns.filter(t => t.type === walletTxnFilter);
            const QUICK_AMTS = [100, 250, 500, 1000, 2000];
            const handleRecharge = () => {
              const amt = parseFloat(rechargeAmt);
              if (!amt || amt < 10) return;
              setRzpOpen(true);
            };
            return (
              <div style={{display:"flex",flexDirection:"column",gap:16}}>
                {/* Balance hero */}
                <div style={{background:"linear-gradient(135deg,#1B5E20,#2E7D32,#388E3C)",borderRadius:16,padding:"28px 28px 22px",color:"#fff",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:-20,right:-20,width:140,height:140,borderRadius:"50%",background:"rgba(255,255,255,.06)"}}/>
                  <div style={{position:"absolute",bottom:-30,right:60,width:90,height:90,borderRadius:"50%",background:"rgba(255,255,255,.04)"}}/>
                  <div style={{fontSize:".8rem",fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",opacity:.8,marginBottom:8}}>
                    💰 Telugu Seemalo Wallet
                  </div>
                  <div style={{fontFamily:"Cormorant Garamond,serif",fontSize:"2.6rem",fontWeight:700,lineHeight:1,marginBottom:4}}>
                    {fmt(walletBalance)}
                  </div>
                  <div style={{fontSize:".82rem",opacity:.75,marginBottom:20}}>Available balance · Use at checkout</div>
                  <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                    <button onClick={() => setRechargeOpen(v => !v)}
                      style={{padding:"9px 22px",background:"rgba(255,255,255,.18)",border:"1.5px solid rgba(255,255,255,.4)",
                        color:"#fff",borderRadius:10,fontWeight:700,cursor:"pointer",fontSize:".86rem",fontFamily:"DM Sans,sans-serif",
                        backdropFilter:"blur(4px)"}}>
                      {rechargeOpen ? "✕ Cancel" : "+ Add Money"}
                    </button>
                    {walletBalance > 0 && (
                      <button onClick={() => setPage("shop")}
                        style={{padding:"9px 22px",background:"rgba(255,255,255,.1)",border:"1.5px solid rgba(255,255,255,.25)",
                          color:"rgba(255,255,255,.85)",borderRadius:10,fontWeight:600,cursor:"pointer",fontSize:".86rem",fontFamily:"DM Sans,sans-serif"}}>
                        🛍 Shop Now
                      </button>
                    )}
                  </div>
                </div>

                {/* Recharge panel */}
                {rechargeOpen && (
                  <div style={{background:"#fff",borderRadius:14,padding:22,boxShadow:"var(--sh)",border:"1.5px solid #E8F5E9"}}>
                    <h4 style={{fontFamily:"Cormorant Garamond,serif",fontSize:"1.1rem",marginBottom:14,color:"var(--dk)"}}>Add Money to Wallet</h4>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
                      {QUICK_AMTS.map(a => (
                        <button key={a} onClick={() => setRechargeAmt(String(a))}
                          style={{padding:"6px 16px",borderRadius:20,border:`1.5px solid ${rechargeAmt === String(a) ? "#2D7D46" : "var(--bd)"}`,
                            background: rechargeAmt === String(a) ? "#E8F5E9" : "#fff",
                            color: rechargeAmt === String(a) ? "#2D7D46" : "var(--mt)",
                            fontWeight: rechargeAmt === String(a) ? 700 : 400,
                            cursor:"pointer",fontSize:".82rem",fontFamily:"DM Sans,sans-serif"}}>
                          ₹{a}
                        </button>
                      ))}
                    </div>
                    <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:12}}>
                      <div style={{position:"relative",flex:1}}>
                        <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",
                          fontWeight:700,color:"#2D7D46",fontSize:"1rem"}}>₹</span>
                        <input type="number" min={10} step={1}
                          placeholder="Enter amount (min ₹10)"
                          value={rechargeAmt}
                          onChange={e => setRechargeAmt(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && handleRecharge()}
                          style={{width:"100%",padding:"10px 12px 10px 28px",border:"1.5px solid var(--bd)",borderRadius:10,
                            fontSize:".9rem",fontFamily:"DM Sans,sans-serif",outline:"none",boxSizing:"border-box"}}/>
                      </div>
                      <button onClick={handleRecharge}
                        disabled={!rechargeAmt || parseFloat(rechargeAmt) < 10}
                        style={{padding:"10px 22px",background: !rechargeAmt || parseFloat(rechargeAmt) < 10 ? "#D1C5BB" : "linear-gradient(135deg,#0F1E4A,#1565C0)",
                          color:"#fff",border:"none",borderRadius:10,fontWeight:700,cursor: !rechargeAmt || parseFloat(rechargeAmt) < 10 ? "not-allowed" : "pointer",
                          fontSize:".88rem",fontFamily:"DM Sans,sans-serif",whiteSpace:"nowrap"}}>
                        {rechargeAmt && parseFloat(rechargeAmt) >= 10 ? `Pay ${fmt(parseFloat(rechargeAmt))}` : "Pay Now"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Transaction history */}
                <div style={{background:"#fff",borderRadius:14,padding:22,boxShadow:"var(--sh)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:10}}>
                    <h3 style={{fontFamily:"Cormorant Garamond,serif",fontSize:"1.1rem",margin:0}}>Transaction History</h3>
                    <div style={{display:"flex",gap:0,background:"#F8F4F0",borderRadius:10,padding:3}}>
                      {[["all","All"],["credit","Credits ↑"],["debit","Debits ↓"]].map(([id,label]) => (
                        <button key={id} onClick={() => { setWalletTxnFilter(id); setWalletTxnPage(0); }}
                          style={{padding:"5px 14px",border:"none",borderRadius:8,cursor:"pointer",
                            fontFamily:"DM Sans,sans-serif",fontSize:".78rem",fontWeight: walletTxnFilter===id ? 700 : 400,
                            background: walletTxnFilter===id ? "#fff" : "none",
                            color: walletTxnFilter===id ? "var(--dk)" : "var(--mt)",
                            boxShadow: walletTxnFilter===id ? "0 1px 4px rgba(0,0,0,.08)" : "none",
                            transition:"all .15s"}}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {(() => {
                    const PAGE_SIZE = 5;
                    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
                    const paged = filtered.slice(walletTxnPage * PAGE_SIZE, (walletTxnPage + 1) * PAGE_SIZE);
                    return filtered.length === 0 ? (
                      <div style={{textAlign:"center",padding:"36px 0",color:"var(--mt)"}}>
                        <div style={{fontSize:"2rem",marginBottom:8}}>💳</div>
                        <p style={{fontSize:".88rem"}}>
                          {walletTxnFilter === "all" ? "No transactions yet. Add money or place an order to get started." : `No ${walletTxnFilter} transactions.`}
                        </p>
                      </div>
                    ) : (
                      <>
                        <div style={{display:"flex",flexDirection:"column",gap:0}}>
                          {paged.map((txn, i) => {
                            const isCredit = txn.type === "credit";
                            return (
                              <div key={txn.id} style={{display:"flex",alignItems:"center",gap:14,
                                padding:"12px 4px",borderBottom: i < paged.length-1 ? "1px solid #F4F0EC" : "none"}}>
                                <div style={{width:40,height:40,borderRadius:"50%",flexShrink:0,
                                  background: isCredit ? "#E8F5E9" : "#FDECEA",
                                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.1rem"}}>
                                  {isCredit ? "↑" : "↓"}
                                </div>
                                <div style={{flex:1,minWidth:0}}>
                                  <div style={{fontWeight:600,fontSize:".86rem",color:"var(--dk)",
                                    overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                                    {txn.description}
                                  </div>
                                  <div style={{display:"flex",alignItems:"center",gap:8,marginTop:3}}>
                                    <span style={{fontSize:".72rem",color:"#9B8472"}}>{fmtTs(txn.createdAt)}</span>
                                    {txn.source && (
                                      <span style={{fontSize:".68rem",background:"#F4F0EC",color:"#6B4C38",
                                        padding:"1px 8px",borderRadius:10,fontWeight:600}}>
                                        {SOURCE_LABEL[txn.source] || txn.source}
                                      </span>
                                    )}
                                    {txn.orderId && (
                                      <span style={{fontSize:".68rem",background:"#EAF2FF",color:"#1A5276",
                                        padding:"1px 8px",borderRadius:10}}>
                                        #{txn.orderId}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div style={{fontWeight:700,fontSize:".95rem",flexShrink:0,
                                  color: isCredit ? "#2D7D46" : "#C0392B"}}>
                                  {isCredit ? "+" : "−"}{fmt(txn.amount)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {totalPages > 1 && (
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
                            marginTop:14,paddingTop:12,borderTop:"1px solid #F4F0EC"}}>
                            <button onClick={() => setWalletTxnPage(p => p - 1)} disabled={walletTxnPage === 0}
                              style={{padding:"6px 16px",border:"1.5px solid var(--bd)",borderRadius:8,background:"#fff",
                                cursor:walletTxnPage===0?"not-allowed":"pointer",color:"var(--mt)",
                                fontSize:".82rem",fontFamily:"DM Sans,sans-serif",opacity:walletTxnPage===0?0.4:1}}>
                              ← Prev
                            </button>
                            <span style={{fontSize:".8rem",color:"var(--mt)"}}>
                              Page {walletTxnPage + 1} of {totalPages}
                            </span>
                            <button onClick={() => setWalletTxnPage(p => p + 1)} disabled={walletTxnPage >= totalPages - 1}
                              style={{padding:"6px 16px",border:"1.5px solid var(--bd)",borderRadius:8,background:"#fff",
                                cursor:walletTxnPage>=totalPages-1?"not-allowed":"pointer",color:"var(--mt)",
                                fontSize:".82rem",fontFamily:"DM Sans,sans-serif",opacity:walletTxnPage>=totalPages-1?0.4:1}}>
                              Next →
                            </button>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            );
          })()}

          {/* ── Addresses ── */}
          {tab === "addresses" && <AddressSection uid={user.uid}/>}

          {/* ── Payment ── */}
          {tab === "payment" && <PaymentSection uid={user.uid}/>}

          {/* ── Orders ── */}
          {tab === "orders" && (
            <div style={{background:"#fff",borderRadius:14,padding:24,boxShadow:"var(--sh)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <h3 style={{fontFamily:"Cormorant Garamond,serif",fontSize:"1.2rem"}}>Order History</h3>
                <span style={{fontSize:".82rem",color:"var(--mt)"}}>{orders.length} order{orders.length!==1?"s":""}</span>
              </div>
              {loading ? (
                <div style={{textAlign:"center",padding:"40px",color:"var(--mt)"}}>Loading orders…</div>
              ) : orders.length === 0 ? (
                <div style={{textAlign:"center",padding:"40px 20px",color:"var(--mt)"}}>
                  <div style={{fontSize:"2.5rem",marginBottom:12}}>📦</div>
                  <p style={{marginBottom:16}}>You haven't placed any orders yet.</p>
                  <button className="btn-sf" onClick={()=>setPage("shop")}>Start Shopping</button>
                </div>
              ) : (() => {
                const totalPages = Math.ceil(orders.length / ORDERS_PER_PAGE);
                const pageOrders = orders.slice((ordersPage - 1) * ORDERS_PER_PAGE, ordersPage * ORDERS_PER_PAGE);
                return (
                  <>
                  <div style={{display:"flex",flexDirection:"column",gap:12}}>
                    {pageOrders.map(o => {
                      const st = STATUS_COLOR[o.status] || STATUS_COLOR.Processing;
                      const _d = o.createdAt?.toDate ? o.createdAt.toDate() : null;
                      const date = _d ? _d.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}) : "—";
                      const time = _d ? _d.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}) : "";
                      const isOpen = expanded === o.docId;
                      return (
                        <div key={o.docId} style={{border:"1.5px solid var(--bd)",borderRadius:12,overflow:"hidden"}}>
                          <div style={{padding:"14px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:12,background:isOpen?"#FDFAF7":"#fff"}}
                            onClick={()=>toggle(o.docId)}>
                            <div style={{flex:1}}>
                              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                                <span style={{fontWeight:700,fontSize:".95rem"}}>{o.id}</span>
                                <span style={{fontSize:".75rem",fontWeight:700,padding:"2px 10px",borderRadius:12,background:st.bg,color:st.color}}>{o.status}</span>
                                {o.returnStatus && (() => {
                                  const rc = RETURN_COLOR[o.returnStatus] || RETURN_COLOR.Pending;
                                  return (
                                    <span style={{fontSize:".72rem",fontWeight:700,padding:"2px 10px",borderRadius:12,background:rc.bg,color:rc.color}}>
                                      {o.returnType==="Exchange"?"🔄":"↩"} {o.returnType} · {o.returnStatus}
                                    </span>
                                  );
                                })()}
                                {o.paymentStatus && (() => {
                                  const ps = o.paymentStatus;
                                  const pbg = ps==="paid"?"#EAF2FF":ps==="wallet"?"#F0FFF4":"#FFF3DC";
                                  const pc  = ps==="paid"?"#1A5276":ps==="wallet"?"#2D7D46":"#B7770D";
                                  const pl  = ps==="paid"?"💳 Razorpay":ps==="wallet"?"💰 Wallet":"🔄 COD";
                                  return <span style={{fontSize:".72rem",fontWeight:700,padding:"2px 10px",borderRadius:12,background:pbg,color:pc}}>{pl}</span>;
                                })()}
                              </div>
                              <div style={{fontSize:".82rem",color:"var(--mt)"}}>
                                {date}{time&&<span style={{color:"#9B8472"}}> · {time}</span>} · {o.items?.length??0} item(s) · <strong style={{color:"var(--dk)"}}>{fmt(o.total)}</strong>
                              </div>
                            </div>
                            <span style={{color:"var(--mt)",fontSize:".85rem",transform:isOpen?"rotate(180deg)":"none",transition:"transform .2s"}}>▾</span>
                          </div>

                          {isOpen && (
                            <div style={{borderTop:"1px solid var(--bd)",padding:"16px"}}>
                              <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:14}}>
                                {(o.items||[]).map((item,i) => (
                                  <div key={i} style={{display:"flex",alignItems:"center",gap:12}}>
                                    <div style={{width:46,height:46,borderRadius:8,background:"linear-gradient(135deg,#FDF0E5,#FFF5EC)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.4rem",flexShrink:0,overflow:"hidden"}}>
                                      {item.images?.[0]
                                        ? <img src={item.images[0]} alt={item.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                                        : <NoImageIcon/>}
                                    </div>
                                    <div style={{flex:1}}>
                                      <div style={{fontWeight:600,fontSize:".88rem"}}>{item.name}</div>
                                      {(item.selSize||item.selColor) && (
                                        <div style={{fontSize:".75rem",color:"var(--mt)"}}>{[item.selSize,item.selColor].filter(Boolean).join(" · ")}</div>
                                      )}
                                    </div>
                                    <div style={{fontSize:".88rem",fontWeight:700}}>{fmt(item.price)} × {item.qty}</div>
                                  </div>
                                ))}
                              </div>
                              <div style={{background:"#F8F4F0",borderRadius:8,padding:"10px 14px",fontSize:".82rem",color:"var(--mt)",marginBottom:14}}>
                                <strong style={{color:"var(--dk)"}}>📍 Delivery to:</strong> {o.addr?.name}, {o.addr?.line1}, {o.addr?.city}, {o.addr?.state} – {o.addr?.pin}
                                <br/>
                                <strong style={{color:"var(--dk)"}}>📞</strong> {o.addr?.phone} &nbsp;·&nbsp;
                                <strong style={{color:"var(--dk)"}}>🚚</strong> {o.ship==="express"?"Express (2–3 days)":"Standard (5–7 days)"}
                                {o.tracking && (<><br/><strong style={{color:"var(--dk)"}}>📮 Tracking:</strong> {o.tracking}</>)}
                              </div>
                              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                                <button className="btn-sf" style={{padding:"7px 16px",fontSize:".82rem",borderRadius:8}} onClick={()=>setInvoice(o)}>
                                  🧾 Download Invoice
                                </button>
                                <button className="btn-sf" style={{background:"none",border:"1.5px solid var(--bd)",color:"var(--mt)",padding:"7px 16px",fontSize:".82rem",borderRadius:8}} onClick={()=>setPage("track")}>
                                  📦 Track Order
                                </button>
                                {o.status==="Delivered" && !o.returnStatus && (
                                  <button className="btn-sf" style={{background:"none",border:"1.5px solid #E8620A",color:"#E8620A",padding:"7px 16px",fontSize:".82rem",borderRadius:8}} onClick={()=>setReturnOrder(o)}>
                                    ↩ Return / Exchange
                                  </button>
                                )}
                                {o.returnStatus && (
                                  <button className="btn-sf" style={{background:"none",border:"1.5px solid #1A5276",color:"#1A5276",padding:"7px 16px",fontSize:".82rem",borderRadius:8}} onClick={()=>setTrackReturn(o)}>
                                    {o.returnType==="Exchange"?"🔄":"↩"} Track {o.returnType}
                                  </button>
                                )}
                                {(o.status==="Processing"||o.status==="Shipped") && (
                                  <button className="btn-sf"
                                    style={{background:"none",border:"1.5px solid #C0392B",color:"#C0392B",padding:"7px 16px",fontSize:".82rem",borderRadius:8,opacity:cancelSending?0.6:1}}
                                    onClick={()=>handleCancelRequest(o)} disabled={cancelSending}>
                                    {cancelSending?"Sending OTP…":"✕ Cancel Order"}
                                  </button>
                                )}
                              </div>
                              {cancelError && (
                                <div style={{marginTop:8,fontSize:".8rem",color:"#C0392B",background:"#FDECEA",borderRadius:6,padding:"7px 12px"}}>
                                  {cancelError}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {totalPages > 1 && (
                    <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginTop:20}}>
                      <button onClick={()=>setOrdersPage(p=>p-1)} disabled={ordersPage===1}
                        style={{padding:"6px 14px",border:"1.5px solid var(--bd)",borderRadius:8,background:"#fff",cursor:ordersPage===1?"not-allowed":"pointer",color:"var(--mt)",fontSize:".85rem",fontFamily:"DM Sans,sans-serif",opacity:ordersPage===1?.45:1}}>
                        ← Prev
                      </button>
                      {Array.from({length:totalPages},(_,i)=>i+1).map(n=>(
                        <button key={n} onClick={()=>setOrdersPage(n)}
                          style={{width:34,height:34,border:n===ordersPage?"none":"1.5px solid var(--bd)",borderRadius:8,background:n===ordersPage?"var(--sf)":"#fff",color:n===ordersPage?"#fff":"var(--mt)",fontWeight:n===ordersPage?700:400,cursor:"pointer",fontSize:".88rem",fontFamily:"DM Sans,sans-serif"}}>
                          {n}
                        </button>
                      ))}
                      <button onClick={()=>setOrdersPage(p=>p+1)} disabled={ordersPage===totalPages}
                        style={{padding:"6px 14px",border:"1.5px solid var(--bd)",borderRadius:8,background:"#fff",cursor:ordersPage===totalPages?"not-allowed":"pointer",color:"var(--mt)",fontSize:".85rem",fontFamily:"DM Sans,sans-serif",opacity:ordersPage===totalPages?.45:1}}>
                        Next →
                      </button>
                    </div>
                  )}
                  </>
                );
              })()}
            </div>
          )}

          {/* ── Support ── */}
          {tab === "support" && (() => {
            const STATUS_STYLE = {
              open:          { bg:"#FFF3E0", color:"#E65100" },
              "in-progress": { bg:"#E3F2FD", color:"#1565C0" },
              resolved:      { bg:"#E8F5E9", color:"#2D7D46" },
              closed:        { bg:"#F4F0EC", color:"#6B4C38" },
            };
            const CAT_LABEL = { general:"General", order:"Order", return:"Return", payment:"Payment", product:"Product", shipping:"Shipping", other:"Other" };

            const fmtTs = (ts) => {
              if (!ts) return "";
              const d = ts.toDate ? ts.toDate() : new Date(ts);
              const diff = Date.now() - d;
              if (diff < 60000)    return "just now";
              if (diff < 3600000)  return `${Math.floor(diff/60000)}m ago`;
              if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`;
              return d.toLocaleDateString("en-IN", { day:"numeric", month:"short" });
            };

            const lastActivity = (t) => {
              const replies = t.replies || [];
              if (replies.length === 0) return { from:"customer", text: t.message, time: t.createdAt };
              const last = replies[replies.length - 1];
              return { from: last.from, text: last.message || (last.images?.length ? "📎 Image" : ""), time: last.createdAt };
            };

            return (
              <div style={{background:"#fff",borderRadius:14,boxShadow:"var(--sh)",overflow:"hidden",
                display:"grid",gridTemplateColumns:"270px 1fr",height:"calc(100vh - 220px)",minHeight:480}}>

                {/* ── LEFT: conversation list ── */}
                <div style={{borderRight:"1px solid #EDE5DA",display:"flex",flexDirection:"column",overflow:"hidden",background:"#FAFAF8"}}>
                  {/* Header */}
                  <div style={{padding:"13px 14px",borderBottom:"1px solid #EDE5DA",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
                    <span style={{fontFamily:"Cormorant Garamond,serif",fontSize:"1.05rem",fontWeight:700,color:"var(--dk)"}}>
                      My Tickets
                      {myTickets.length > 0 && <span style={{fontWeight:400,color:"var(--mt)",fontSize:".9rem",marginLeft:6}}>({myTickets.length})</span>}
                    </span>
                    <button className="btn-sf" style={{padding:"4px 12px",fontSize:".76rem",borderRadius:7}}
                      onClick={() => setPage("contact")}>+ New</button>
                  </div>

                  {myTickets.length === 0 ? (
                    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                      color:"var(--mt)",padding:20,gap:10,textAlign:"center"}}>
                      <div style={{fontSize:"2rem"}}>💬</div>
                      <p style={{fontSize:".82rem"}}>No conversations yet</p>
                      <button className="btn-sf" style={{padding:"6px 14px",fontSize:".8rem",borderRadius:8}}
                        onClick={() => setPage("contact")}>Contact Support</button>
                    </div>
                  ) : (
                    <div style={{flex:1,overflowY:"auto"}}>
                      {myTickets.map(t => {
                        const last    = lastActivity(t);
                        const ss      = STATUS_STYLE[t.status] || STATUS_STYLE.open;
                        const unread  = last.from === "admin";
                        const isActive = selTicketId === t.id;
                        return (
                          <div key={t.id} onClick={() => setSelTicketId(t.id)}
                            style={{padding:"11px 14px",borderBottom:"1px solid #F0EAE2",cursor:"pointer",
                              background: isActive ? "#FFF8F3" : "#fff",
                              borderLeft: `3px solid ${isActive ? "#E8620A" : "transparent"}`,
                              transition:"background .12s,border-color .12s"}}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:6,marginBottom:3}}>
                              <span style={{fontWeight: unread ? 700 : 600,fontSize:".84rem",color:"var(--dk)",
                                overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1,lineHeight:1.3}}>
                                {t.subject}
                              </span>
                              <span style={{fontSize:".68rem",color:"#9B8472",flexShrink:0,marginTop:1}}>
                                {fmtTs(last.time)}
                              </span>
                            </div>
                            <div style={{display:"flex",alignItems:"center",gap:5}}>
                              <span style={{fontSize:".74rem",color: unread ? "var(--dk)" : "var(--mt)",
                                fontWeight: unread ? 600 : 400,
                                overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>
                                {last.from === "admin" ? "Support: " : "You: "}
                                {(last.text||"").slice(0,38)}{(last.text||"").length > 38 ? "…" : ""}
                              </span>
                              <span style={{fontSize:".65rem",fontWeight:700,padding:"1px 7px",borderRadius:10,
                                background:ss.bg,color:ss.color,flexShrink:0,whiteSpace:"nowrap"}}>
                                {t.status === "in-progress" ? "Active" : t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                              </span>
                              {unread && <span style={{width:7,height:7,borderRadius:"50%",background:"#E8620A",flexShrink:0}}/>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ── RIGHT: live chat panel ── */}
                {!liveTicket ? (
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                    color:"var(--mt)",gap:10,padding:32,background:"#F8F4F0"}}>
                    <div style={{fontSize:"2.5rem"}}>💬</div>
                    <div style={{fontFamily:"Cormorant Garamond,serif",fontSize:"1.1rem",fontWeight:700,color:"var(--dk)"}}>
                      {myTickets.length > 0 ? "Select a conversation" : "No conversations yet"}
                    </div>
                    {myTickets.length === 0 && (
                      <button className="btn-sf" style={{padding:"8px 18px",fontSize:".88rem",borderRadius:10,marginTop:6}}
                        onClick={() => setPage("contact")}>Start a Conversation</button>
                    )}
                  </div>
                ) : (
                  <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>

                    {/* Chat header */}
                    <div style={{padding:"11px 16px",borderBottom:"1px solid #EDE5DA",background:"#FAFAF8",flexShrink:0}}>
                      <div style={{fontWeight:700,fontSize:".9rem",color:"var(--dk)",
                        overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:4}}>
                        {liveTicket.subject}
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                        <span style={{fontSize:".68rem",fontFamily:"monospace",color:"#9B8472"}}>
                          {liveTicket.ticketId || `#${liveTicket.id.slice(-8)}`}
                        </span>
                        <span style={{fontSize:".7rem",fontWeight:700,padding:"1px 8px",borderRadius:10,
                          background:(STATUS_STYLE[liveTicket.status]||STATUS_STYLE.open).bg,
                          color:(STATUS_STYLE[liveTicket.status]||STATUS_STYLE.open).color}}>
                          {liveTicket.status === "in-progress" ? "In Progress" : liveTicket.status.charAt(0).toUpperCase()+liveTicket.status.slice(1)}
                        </span>
                        <span style={{fontSize:".7rem",background:"#F4F0EC",color:"#6B4C38",padding:"1px 8px",borderRadius:10}}>
                          {CAT_LABEL[liveTicket.category] || liveTicket.category}
                        </span>
                        {liveTicket.orderId && (
                          <span style={{fontSize:".7rem",color:"#6B4C38"}}>📦 {liveTicket.orderId}</span>
                        )}
                      </div>
                    </div>

                    {/* Messages */}
                    <div ref={supportThreadRef}
                      style={{flex:1,overflowY:"auto",padding:"16px 18px",
                        display:"flex",flexDirection:"column",gap:10,background:"#F8F4F0"}}>

                      {/* Original message (always customer) */}
                      <div style={{alignSelf:"flex-end",maxWidth:"78%"}}>
                        <div style={{fontSize:".7rem",color:"#9B8472",textAlign:"right",marginBottom:3}}>
                          You · {fmtTs(liveTicket.createdAt)}
                        </div>
                        <div style={{background:"linear-gradient(135deg,#E8620A,#C9901A)",color:"#fff",
                          borderRadius:"14px 14px 2px 14px",padding:"10px 14px",fontSize:".85rem",lineHeight:1.5}}>
                          {liveTicket.message}
                        </div>
                      </div>

                      {/* Reply bubbles */}
                      {(liveTicket.replies || []).map(r => {
                        const isAdmin = r.from === "admin";
                        return (
                          <div key={r.id} style={{alignSelf: isAdmin ? "flex-start" : "flex-end", maxWidth:"78%"}}>
                            <div style={{fontSize:".7rem",color:"#9B8472",marginBottom:3,
                              textAlign: isAdmin ? "left" : "right"}}>
                              {isAdmin ? "Support Team" : "You"} · {fmtTs(r.createdAt)}
                            </div>
                            <div style={{
                              background: isAdmin ? "#fff" : "linear-gradient(135deg,#E8620A,#C9901A)",
                              color: isAdmin ? "var(--dk)" : "#fff",
                              border: isAdmin ? "1px solid #EDE5DA" : "none",
                              borderRadius: isAdmin ? "14px 14px 14px 2px" : "14px 14px 2px 14px",
                              padding:"10px 14px",fontSize:".85rem",lineHeight:1.5,
                              boxShadow: isAdmin ? "0 1px 4px rgba(0,0,0,.06)" : "none"}}>
                              {r.message}
                              {r.images?.length > 0 && (
                                <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:r.message ? 8 : 0}}>
                                  {r.images.map((img, idx) => (
                                    <a key={idx} href={img} target="_blank" rel="noreferrer"
                                      style={{display:"block",borderRadius:8,overflow:"hidden",
                                        border:`2px solid ${isAdmin ? "#EDE5DA" : "rgba(255,255,255,.4)"}`}}>
                                      <img src={img} alt="" style={{width:80,height:80,objectFit:"cover",display:"block"}}/>
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* Resolved / closed marker */}
                      {(liveTicket.status === "resolved" || liveTicket.status === "closed") && (
                        <div style={{textAlign:"center",padding:"8px 0"}}>
                          <span style={{fontSize:".75rem",background:"#E8F5E9",color:"#2D7D46",
                            padding:"4px 14px",borderRadius:20,fontWeight:600}}>
                            ✅ Ticket {liveTicket.status}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Reply box */}
                    {liveTicket.status !== "resolved" && liveTicket.status !== "closed" ? (
                      <div style={{padding:"10px 14px",borderTop:"1px solid #EDE5DA",background:"#fff",flexShrink:0}}>
                        {replyImages.length > 0 && (
                          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>
                            {replyImages.map((img, idx) => (
                              <div key={idx} style={{position:"relative",width:52,height:52,borderRadius:7,overflow:"hidden",border:"1.5px solid #EDE5DA"}}>
                                <img src={img.url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                                <button onClick={() => setReplyImages(prev => prev.filter((_,i) => i !== idx))}
                                  style={{position:"absolute",top:1,right:1,background:"rgba(0,0,0,.55)",border:"none",
                                    borderRadius:"50%",width:16,height:16,cursor:"pointer",color:"#fff",
                                    fontSize:".65rem",display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1}}>×</button>
                              </div>
                            ))}
                            {replyUploading && (
                              <div style={{width:52,height:52,borderRadius:7,background:"#F4F0EC",
                                border:"1.5px dashed #C9A882",display:"flex",alignItems:"center",
                                justifyContent:"center",fontSize:".75rem",color:"#9B8472"}}>⏳</div>
                            )}
                          </div>
                        )}
                        <div style={{display:"flex",gap:7,alignItems:"flex-end"}}>
                          <textarea rows={2} placeholder="Type a message…"
                            value={replyText}
                            onChange={e => setReplyText(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }}
                            style={{flex:1,padding:"9px 12px",border:"1.5px solid #EDE5DA",borderRadius:10,
                              resize:"none",fontFamily:"DM Sans,sans-serif",fontSize:".86rem",outline:"none",lineHeight:1.5}}/>
                          <label title="Attach images" style={{cursor:"pointer",flexShrink:0}}>
                            <input type="file" accept="image/*" multiple style={{display:"none"}}
                              disabled={replyImages.length >= 5 || replyUploading}
                              onChange={e => { handleSupportImages(e.target.files); e.target.value=""; }}/>
                            <div style={{width:36,height:36,borderRadius:8,border:"1.5px solid #EDE5DA",
                              background:"#FFF8F3",display:"flex",alignItems:"center",justifyContent:"center",
                              fontSize:"1rem",opacity: replyImages.length >= 5 ? 0.5 : 1}}>🖼️</div>
                          </label>
                          <button onClick={handleSendReply}
                            disabled={(!replyText.trim() && replyImages.length === 0) || replySending || replyUploading}
                            style={{width:36,height:36,borderRadius:8,border:"none",flexShrink:0,
                              background:(!replyText.trim() && replyImages.length === 0)||replySending||replyUploading
                                ? "#EDE5DA" : "linear-gradient(135deg,#E8620A,#C9901A)",
                              color:(!replyText.trim() && replyImages.length === 0)||replySending||replyUploading
                                ? "#9B8472" : "#fff",
                              cursor:(!replyText.trim() && replyImages.length === 0)||replySending||replyUploading
                                ? "not-allowed" : "pointer",
                              fontSize:"1rem",display:"flex",alignItems:"center",justifyContent:"center"}}>
                            {replySending ? "⏳" : "➤"}
                          </button>
                        </div>
                        <div style={{fontSize:".7rem",color:"#9B8472",marginTop:5}}>
                          Enter to send · Shift+Enter for new line · Up to 5 images
                        </div>
                      </div>
                    ) : (
                      <div style={{padding:"10px 16px",background:"#F8F4F0",textAlign:"center",
                        fontSize:".82rem",color:"#9B8472",flexShrink:0,borderTop:"1px solid #EDE5DA"}}>
                        This ticket is {liveTicket.status}.{" "}
                        <button onClick={() => setPage("contact")}
                          style={{background:"none",border:"none",cursor:"pointer",color:"var(--sf)",
                            fontWeight:600,fontSize:".82rem",padding:0,fontFamily:"DM Sans,sans-serif"}}>
                          Open a new ticket
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* ── Wishlist ── */}
          {tab === "wishlist" && (() => {
            const items = wishlistIds.map(id=>products.find(p=>p.id===id)).filter(Boolean);
            const removeItem = (id) => { toggleWishlist(id); setWishlistIds(getWishlistIds()); };
            return (
              <div style={{background:"#fff",borderRadius:14,padding:24,boxShadow:"var(--sh)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:items.length?16:12}}>
                  <h3 style={{fontFamily:"Cormorant Garamond,serif",fontSize:"1.2rem"}}>
                    Wishlist <span style={{fontWeight:400,color:"var(--mt)",fontSize:"1rem",marginLeft:8}}>({items.length})</span>
                  </h3>
                  {items.length > 0 && (
                    <button onClick={()=>setPage("shop")}
                      style={{background:"none",border:"1px solid var(--bd)",borderRadius:8,padding:"4px 12px",cursor:"pointer",fontSize:".78rem",color:"var(--mt)",fontFamily:"DM Sans,sans-serif"}}>
                      Browse More
                    </button>
                  )}
                </div>
                {items.length === 0 ? (
                  <div style={{textAlign:"center",padding:"40px 20px",color:"var(--mt)"}}>
                    <div style={{fontSize:"2.5rem",marginBottom:10}}>♡</div>
                    <p style={{fontSize:".88rem",marginBottom:14}}>Your wishlist is empty. Tap ♡ on any product to save it here.</p>
                    <button className="btn-sf" style={{padding:"8px 20px",fontSize:".88rem",borderRadius:10}} onClick={()=>setPage("shop")}>
                      Browse Products
                    </button>
                  </div>
                ) : (
                  <div className="wl-grid">
                    {items.map(p => (
                      <div key={p.id} className="wl-card" onClick={()=>onOpen?.(p)}>
                        <div className="wl-img">
                          {p.images?.[0]?<img src={p.images[0]} alt={p.name}/>:<NoImageIcon/>}
                          <button className="wl-rm" title="Remove" onClick={e=>{e.stopPropagation();removeItem(p.id);}}>×</button>
                        </div>
                        <div className="wl-body">
                          <div className="wl-name">{p.name}</div>
                          <div className="wl-price">{fmt(p.price)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {/* ── Room Designs ── */}
          {tab === "room" && (
            <div style={{background:"#fff",borderRadius:14,padding:24,boxShadow:"var(--sh)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
                <h3 style={{fontFamily:"Cormorant Garamond,serif",fontSize:"1.2rem",margin:0}}>
                  🏠 Saved Room Designs
                </h3>
                <button onClick={() => setPage("room")}
                  style={{background:"#E8620A",color:"#fff",border:"none",borderRadius:9,
                    padding:"7px 16px",fontSize:".82rem",fontWeight:700,cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>
                  + New Design
                </button>
              </div>
              {roomDesignsLoading ? (
                <div style={{textAlign:"center",padding:"40px 0",color:"var(--mt)"}}>Loading…</div>
              ) : roomDesigns.length === 0 ? (
                <div style={{textAlign:"center",padding:"40px 20px",color:"var(--mt)"}}>
                  <div style={{fontSize:"2.5rem",marginBottom:10}}>🏠</div>
                  <p style={{fontSize:".88rem",marginBottom:14}}>You haven't saved any room designs yet.</p>
                  <button className="btn-sf" style={{padding:"8px 20px",fontSize:".88rem",borderRadius:10}} onClick={() => setPage("room")}>
                    Open Room Builder
                  </button>
                </div>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  {roomDesigns.map(d => {
                    const dateStr = d.createdAt?.toDate?.()
                      ? d.createdAt.toDate().toLocaleDateString("en-IN", {day:"2-digit",month:"short",year:"numeric"})
                      : "—";
                    const total = (d.items || []).reduce((s, i) => s + (i.price || 0), 0);
                    return (
                      <div key={d.id} style={{border:"1.5px solid var(--bd)",borderRadius:12,
                        padding:"14px 18px",display:"flex",alignItems:"center",gap:16,
                        background:"#FDFAF7"}}>
                        <div style={{width:44,height:44,background:"#F0E8DA",borderRadius:10,
                          display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.5rem",flexShrink:0}}>
                          🏠
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontWeight:700,fontSize:".92rem",color:"var(--dk)",
                            overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                            {d.name || "Untitled Design"}
                          </div>
                          <div style={{fontSize:".78rem",color:"var(--mt)",marginTop:2}}>
                            {(d.items || []).length} item{(d.items || []).length !== 1 ? "s" : ""}
                            {" · "}
                            {fmt(total)} estimated
                            {" · "}
                            Saved {dateStr}
                          </div>
                        </div>
                        <div style={{display:"flex",gap:8,flexShrink:0}}>
                          <button onClick={() => setPage("room", { urlSuffix: `?design=${d.id}` })}
                            style={{padding:"6px 14px",background:"#E8620A",color:"#fff",border:"none",
                              borderRadius:8,fontWeight:700,cursor:"pointer",fontSize:".78rem",
                              fontFamily:"DM Sans,sans-serif"}}>
                            Open
                          </button>
                          <button onClick={async () => {
                            await deleteDesign(d.id);
                            setRoomDesigns(prev => prev.filter(x => x.id !== d.id));
                          }}
                            style={{padding:"6px 10px",background:"#fff",color:"#C0392B",
                              border:"1.5px solid #FADBD8",borderRadius:8,cursor:"pointer",
                              fontSize:".78rem",fontFamily:"DM Sans,sans-serif"}}>
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Security ── */}
          {tab === "security" && (
            <div style={{display:"flex",flexDirection:"column",gap:20}}>

              {/* ── Change Password ── */}
              <div style={{background:"#fff",borderRadius:14,padding:24,boxShadow:"var(--sh)"}}>
                <h3 style={{fontFamily:"Cormorant Garamond,serif",fontSize:"1.2rem",marginBottom:20}}>Change Password</h3>
                <div style={{display:"flex",flexDirection:"column",gap:14,maxWidth:420}}>
                  {[
                    {key:"current",label:"Current Password"},
                    {key:"next",   label:"New Password"},
                    {key:"confirm",label:"Confirm New Password"},
                  ].map(({key,label}) => (
                    <div key={key} style={{position:"relative"}}>
                      <div style={{fontSize:".78rem",fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",color:"#6B4C38",marginBottom:6}}>{label}</div>
                      <input
                        type={showPw[key]?"text":"password"}
                        placeholder="••••••••"
                        value={pw[key]}
                        onChange={e=>setPw(p=>({...p,[key]:e.target.value}))}
                        style={{width:"100%",padding:"9px 44px 9px 12px",border:"1.5px solid var(--bd)",borderRadius:9,fontSize:".9rem",fontFamily:"DM Sans,sans-serif",outline:"none",boxSizing:"border-box"}}
                      />
                      <button type="button" onClick={()=>setShowPw(s=>({...s,[key]:!s[key]}))}
                        style={{position:"absolute",right:12,bottom:9,background:"none",border:"none",cursor:"pointer",fontSize:".8rem",color:"#6B4C38",padding:0,fontFamily:"DM Sans,sans-serif"}}>
                        {showPw[key]?"Hide":"Show"}
                      </button>
                    </div>
                  ))}
                  {pwError   && <div style={{background:"#FDECEA",color:"#C0392B",borderRadius:8,padding:"9px 14px",fontSize:".84rem"}}>{pwError}</div>}
                  {pwSuccess && <div style={{background:"#E8F5EC",color:"#2D7D46",borderRadius:8,padding:"9px 14px",fontSize:".84rem",fontWeight:600}}>✅ {pwSuccess}</div>}
                  <button className="btn-sf" style={{padding:"10px 0",borderRadius:10,fontSize:".9rem",opacity:pwSaving?0.7:1}}
                    onClick={handleChangePassword} disabled={pwSaving}>
                    {pwSaving?"Sending OTP…":"Update Password"}
                  </button>
                </div>
              </div>

              {/* ── Connected Accounts ── */}
              <div style={{background:"#fff",borderRadius:14,padding:24,boxShadow:"var(--sh)"}}>
                <h3 style={{fontFamily:"Cormorant Garamond,serif",fontSize:"1.2rem",marginBottom:6}}>Connected Accounts</h3>
                <p style={{fontSize:".82rem",color:"var(--mt)",marginBottom:20}}>Manage how you sign in to Telugu Seemalo.</p>

                {/* Google row */}
                <div style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",
                  border:"1.5px solid var(--bd)",borderRadius:12,maxWidth:420}}>
                  {/* Google icon */}
                  <svg width="22" height="22" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:".88rem",color:"var(--dk)"}}>Google</div>
                    <div style={{fontSize:".78rem",color:"var(--mt)"}}>{user.email}</div>
                  </div>
                  {providers.includes("google.com") ? (
                    <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                      <span style={{fontSize:".72rem",background:"#E8F5E9",color:"#2D7D46",padding:"2px 10px",borderRadius:20,fontWeight:700}}>✓ Connected</span>
                      {providers.includes("password") ? (
                        <button
                          disabled={unlinkBusy}
                          onClick={async () => {
                            setUnlinkError("");
                            if (!window.confirm("Unlink Google? You'll sign in with email & password only.")) return;
                            setUnlinkBusy(true);
                            try {
                              await unlinkGoogle();
                              setProviders(getLinkedProviders());
                            } catch (e) {
                              setUnlinkError(e.message || "Failed to unlink.");
                            } finally {
                              setUnlinkBusy(false);
                            }
                          }}
                          style={{background:"none",border:"1px solid #FADBD8",borderRadius:7,padding:"3px 12px",
                            cursor:"pointer",fontSize:".75rem",color:"#C0392B",fontFamily:"DM Sans,sans-serif",
                            opacity:unlinkBusy?0.6:1}}>
                          {unlinkBusy ? "Unlinking…" : "Unlink"}
                        </button>
                      ) : (
                        <span style={{fontSize:".72rem",color:"#B7770D"}}>Set a password first to unlink</span>
                      )}
                    </div>
                  ) : (
                    <span style={{fontSize:".72rem",background:"#F4F0EC",color:"#9B8472",padding:"2px 10px",borderRadius:20,fontWeight:600}}>Not connected</span>
                  )}
                </div>
                {unlinkError && (
                  <div style={{marginTop:10,maxWidth:420,background:"#FDECEA",color:"#C0392B",borderRadius:8,padding:"8px 14px",fontSize:".82rem"}}>
                    {unlinkError}
                  </div>
                )}
              </div>

            </div>
          )}

        </main>
      </div>

      {/* Modals */}
      {invoice && <InvoiceModal order={invoice} onClose={()=>setInvoice(null)}/>}
      {returnOrder && (
        <ReturnExchangeModal order={returnOrder} user={user} onClose={()=>setReturnOrder(null)} onSubmitted={()=>setReturnOrder(null)}/>
      )}
      {trackReturn && (
        <ReturnTrackingModal order={trackReturn} onClose={()=>setTrackReturn(null)}/>
      )}
      {cancelTarget && (
        <OtpVerifyModal email={user.email} purpose="Cancel Order" onVerify={handleCancelVerify} onResend={handleCancelResend} onClose={()=>{setCancelTarget(null);setCancelOtp("");}}/>
      )}
      {pwOtpStep && (
        <OtpVerifyModal email={user.email} purpose="Change Password" onVerify={handlePwOtpVerify} onResend={handlePwOtpResend} onClose={()=>{setPwOtpStep(false);setPwPendingOtp("");}}/>
      )}
      {rzpOpen && rechargeAmt && parseFloat(rechargeAmt) >= 10 && (
        <RazorpayModal
          amount={parseFloat(rechargeAmt)}
          purpose="Wallet Recharge"
          onSuccess={async () => {
            setRzpOpen(false);
            setRechargePaying(true);
            try {
              await rechargeWallet(user.uid, parseFloat(rechargeAmt));
              setRechargeAmt("");
              setRechargeOpen(false);
            } finally {
              setRechargePaying(false);
            }
          }}
          onClose={() => setRzpOpen(false)}
        />
      )}
    </>
  );
}
