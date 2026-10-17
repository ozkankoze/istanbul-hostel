import type { Locale } from "@/i18n/config";

type Doc = { sections: { heading: string; body: string[] }[] };

/** Template legal text for the demo. Must be reviewed by a lawyer before production use. */
export const privacy: Record<Locale, Doc> = {
  en: {
    sections: [
      { heading: "Who we are", body: ["Istanbul Hostel (\"we\") operates this website and the guest guide. This is demonstration text prepared by Medya 333; a real property must insert its legal entity, address and data-protection contact here."] },
      { heading: "What we collect", body: ["When you send a reservation, tour, transfer or contact request we collect your name, email address, phone number, country, stay dates and any notes you add.", "When you verify your stay in the guest guide we store a short-lived, encrypted session cookie linked to your reservation.", "We do not take card payments online and do not store payment card data."] },
      { heading: "Why we use it", body: ["To answer and manage your requests, prepare your room, communicate about your stay, meet legal guest-registration obligations in Türkiye, and keep our premises safe."] },
      { heading: "How long we keep it", body: ["Reservation records are kept for as long as required by Turkish accommodation and tax law. Contact messages and feedback are deleted after 24 months unless they are part of a booking."] },
      { heading: "Who we share it with", body: ["Only with service providers who help us run the hostel (for example our hosting provider and tour partners for the experiences you request), and with authorities where the law requires it. We never sell your data."] },
      { heading: "Your rights", body: ["Under the Turkish Personal Data Protection Law (KVKK) and, where applicable, the EU GDPR, you can ask to access, correct or delete your data, or object to its use. Write to the email address on our contact page."] },
      { heading: "Cookies", body: ["We use only essential cookies: one to remember your language and, if you sign in to the guest guide, one session cookie. No advertising or tracking cookies are used."] },
    ],
  },
  bs: {
    sections: [
      { heading: "Ko smo mi", body: ["Istanbul Hostel (\"mi\") upravlja ovom web stranicom i vodičem za goste. Ovo je demonstracijski tekst koji je pripremila kompanija Medya 333; stvarni objekat ovdje mora upisati svoje pravno lice, adresu i kontakt za zaštitu podataka."] },
      { heading: "Koje podatke prikupljamo", body: ["Kada pošaljete zahtjev za rezervaciju, turu, transfer ili kontakt, prikupljamo vaše ime, e-mail adresu, broj telefona, državu, datume boravka i napomene koje dodate.", "Kada potvrdite boravak u vodiču za goste, čuvamo kratkotrajni šifrovani kolačić sesije povezan s vašom rezervacijom.", "Ne primamo plaćanja karticom online i ne čuvamo podatke o platnim karticama."] },
      { heading: "Zašto ih koristimo", body: ["Da odgovorimo na vaše zahtjeve i upravljamo njima, pripremimo sobu, komuniciramo o boravku, ispunimo zakonske obaveze prijave gostiju u Turskoj i održimo sigurnost objekta."] },
      { heading: "Koliko dugo ih čuvamo", body: ["Podaci o rezervacijama čuvaju se onoliko dugo koliko to zahtijevaju turski zakoni o smještaju i porezima. Kontakt poruke i utisci brišu se nakon 24 mjeseca, osim ako nisu dio rezervacije."] },
      { heading: "S kim ih dijelimo", body: ["Samo s pružaocima usluga koji nam pomažu u radu hostela (npr. hosting i partneri za ture koje zatražite) te s nadležnim organima kada to zakon nalaže. Nikada ne prodajemo vaše podatke."] },
      { heading: "Vaša prava", body: ["Prema turskom Zakonu o zaštiti ličnih podataka (KVKK) i, gdje je primjenjivo, GDPR-u EU, možete zatražiti pristup, ispravku ili brisanje podataka, odnosno uložiti prigovor na njihovu upotrebu. Pišite na e-mail adresu s naše stranice za kontakt."] },
      { heading: "Kolačići", body: ["Koristimo samo neophodne kolačiće: jedan za pamćenje jezika i, ako se prijavite u vodič za goste, jedan kolačić sesije. Ne koristimo reklamne kolačiće niti kolačiće za praćenje."] },
    ],
  },
  tr: {
    sections: [
      { heading: "Biz kimiz", body: ["Bu web sitesi ve misafir rehberi Istanbul Hostel (\"biz\") tarafından işletilmektedir. Bu metin Medya 333 tarafından hazırlanmış demo metnidir; gerçek bir işletme buraya tüzel kişilik bilgilerini, adresini ve veri koruma irtibat bilgisini eklemelidir."] },
      { heading: "Hangi verileri topluyoruz", body: ["Rezervasyon, tur, transfer veya iletişim talebi gönderdiğinizde adınızı, e-posta adresinizi, telefon numaranızı, ülkenizi, konaklama tarihlerinizi ve eklediğiniz notları alırız.", "Misafir rehberinde konaklamanızı doğruladığınızda rezervasyonunuzla bağlantılı, kısa süreli ve şifreli bir oturum çerezi saklarız.", "Online kart ödemesi almıyor ve kart bilgisi saklamıyoruz."] },
      { heading: "Verileri neden kullanıyoruz", body: ["Taleplerinizi yanıtlamak ve yönetmek, odanızı hazırlamak, konaklamanız hakkında iletişim kurmak, Türkiye'deki yasal konaklama bildirim yükümlülüklerini yerine getirmek ve tesisimizin güvenliğini sağlamak için."] },
      { heading: "Ne kadar süre saklıyoruz", body: ["Rezervasyon kayıtları Türk konaklama ve vergi mevzuatının gerektirdiği süre boyunca saklanır. İletişim mesajları ve geri bildirimler, bir rezervasyonun parçası değilse 24 ay sonra silinir."] },
      { heading: "Kimlerle paylaşıyoruz", body: ["Yalnızca hostelin işleyişine yardımcı olan hizmet sağlayıcılarla (ör. barındırma sağlayıcımız ve talep ettiğiniz deneyimler için tur ortaklarımız) ve yasanın gerektirdiği durumlarda yetkili makamlarla. Verilerinizi asla satmayız."] },
      { heading: "Haklarınız", body: ["6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) ve uygulanabildiği ölçüde AB GDPR kapsamında verilerinize erişme, düzeltilmesini veya silinmesini isteme ve işlenmesine itiraz etme hakkına sahipsiniz. İletişim sayfamızdaki e-posta adresine yazın."] },
      { heading: "Çerezler", body: ["Yalnızca zorunlu çerezler kullanıyoruz: dil tercihinizi hatırlayan bir çerez ve misafir rehberine giriş yaparsanız bir oturum çerezi. Reklam veya izleme çerezi kullanılmaz."] },
    ],
  },
};

export const terms: Record<Locale, Doc> = {
  en: {
    sections: [
      { heading: "Reservation requests", body: ["Bookings made on this website are requests. A reservation is only confirmed when you receive a confirmation from our reception team. Until then, availability and prices are not guaranteed."] },
      { heading: "Payment", body: ["No payment is taken online. The confirmed total is paid at reception on arrival, by card or in cash. City tax, where applicable, is charged separately."] },
      { heading: "Cancellation", body: ["You may cancel free of charge up to 48 hours before your arrival date. Later cancellations and no-shows may be charged the first night."] },
      { heading: "Check-in and identification", body: ["Check-in is from 14:00 and check-out until 11:00. All guests must show a valid passport or national ID at check-in, as required by Turkish law. Dormitory guests must be 18 or older."] },
      { heading: "House rules", body: ["Quiet hours, the non-smoking policy and other house rules shown in the guest guide apply to everyone. We may end the stay of guests who seriously or repeatedly break them, without refund for the remaining nights."] },
      { heading: "Tours and transfers", body: ["Experiences and transfers are requests until confirmed. Some are operated by partner companies; their own terms may apply. Prices shown are per person unless marked per group."] },
      { heading: "Liability", body: ["Please use the lockers provided. We are not responsible for valuables left outside them, except where the law says otherwise."] },
    ],
  },
  bs: {
    sections: [
      { heading: "Zahtjevi za rezervaciju", body: ["Rezervacije napravljene na ovoj stranici su zahtjevi. Rezervacija je potvrđena tek kada dobijete potvrdu od našeg tima na recepciji. Do tada dostupnost i cijene nisu zagarantovane."] },
      { heading: "Plaćanje", body: ["Online se ništa ne naplaćuje. Potvrđeni iznos plaća se na recepciji po dolasku, karticom ili gotovinom. Gradska taksa, gdje je primjenjiva, naplaćuje se zasebno."] },
      { heading: "Otkazivanje", body: ["Rezervaciju možete besplatno otkazati do 48 sati prije dolaska. Za kasnija otkazivanja i nedolazak može se naplatiti prva noć."] },
      { heading: "Prijava i identifikacija", body: ["Prijava je od 14:00, a odjava do 11:00. Svi gosti pri prijavi moraju pokazati važeći pasoš ili ličnu kartu, u skladu s turskim zakonom. Gosti u spavaonicama moraju imati najmanje 18 godina."] },
      { heading: "Kućni red", body: ["Sati tišine, zabrana pušenja i ostala pravila iz vodiča za goste važe za sve. Gostima koji ozbiljno ili ponovljeno krše pravila možemo prekinuti boravak bez povrata novca za preostale noći."] },
      { heading: "Ture i transferi", body: ["Doživljaji i transferi su zahtjevi dok ih ne potvrdimo. Neke organizuju partnerske kompanije čiji uslovi mogu važiti. Prikazane cijene su po osobi, osim ako je navedeno po grupi."] },
      { heading: "Odgovornost", body: ["Molimo koristite ormariće. Ne odgovaramo za vrijedne stvari ostavljene izvan njih, osim ako zakon ne propisuje drugačije."] },
    ],
  },
  tr: {
    sections: [
      { heading: "Rezervasyon talepleri", body: ["Bu web sitesinde yapılan rezervasyonlar taleptir. Rezervasyon, ancak resepsiyon ekibimizden onay aldığınızda kesinleşir. O zamana kadar müsaitlik ve fiyatlar garanti edilmez."] },
      { heading: "Ödeme", body: ["Online ödeme alınmaz. Onaylanan tutar varışta resepsiyonda kartla veya nakit ödenir. Varsa konaklama vergisi ayrıca tahsil edilir."] },
      { heading: "İptal", body: ["Varış tarihinizden 48 saat öncesine kadar ücretsiz iptal edebilirsiniz. Daha geç iptallerde ve gelmeme durumunda ilk gece ücreti alınabilir."] },
      { heading: "Giriş ve kimlik", body: ["Giriş 14.00'ten itibaren, çıkış 11.00'e kadardır. Türk mevzuatı gereği tüm misafirler girişte geçerli pasaport veya kimlik kartı göstermelidir. Yatakhane misafirleri 18 yaşından büyük olmalıdır."] },
      { heading: "Ev kuralları", body: ["Sessiz saatler, sigara içmeme kuralı ve misafir rehberindeki diğer kurallar herkes için geçerlidir. Kuralları ciddi veya tekrarlı şekilde ihlal eden misafirlerin konaklaması, kalan geceler iade edilmeden sonlandırılabilir."] },
      { heading: "Turlar ve transferler", body: ["Deneyimler ve transferler onaylanana kadar taleptir. Bazıları iş ortağı şirketler tarafından yürütülür ve onların koşulları geçerli olabilir. Gösterilen fiyatlar, grup başı belirtilmedikçe kişi başıdır."] },
      { heading: "Sorumluluk", body: ["Lütfen size ayrılan dolapları kullanın. Kanunun aksini öngördüğü durumlar dışında, dolap dışında bırakılan değerli eşyalardan sorumlu değiliz."] },
    ],
  },
};
