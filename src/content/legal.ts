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
  sr: {
    sections: [
      { heading: "Ko smo mi", body: ["Istanbul Hostel (\"mi\") upravlja ovim veb-sajtom i vodičem za goste. Ovo je demonstracioni tekst koji je pripremila kompanija Medya 333; stvarni objekat ovde mora da navede svoje pravno lice, adresu i kontakt za zaštitu podataka."] },
      { heading: "Koje podatke prikupljamo", body: ["Kada pošaljete zahtev za rezervaciju, turu, transfer ili kontakt, prikupljamo vaše ime, e-mail adresu, broj telefona, državu, datume boravka i napomene koje dodate.", "Kada potvrdite boravak u vodiču za goste, čuvamo kratkotrajni šifrovani kolačić sesije povezan sa vašom rezervacijom.", "Ne primamo plaćanja karticom preko interneta i ne čuvamo podatke o platnim karticama."] },
      { heading: "Zašto ih koristimo", body: ["Da bismo odgovorili na vaše zahteve i upravljali njima, pripremili sobu, komunicirali sa vama o boravku, ispunili zakonske obaveze prijave gostiju u Turskoj i održavali bezbednost objekta."] },
      { heading: "Koliko dugo ih čuvamo", body: ["Podaci o rezervacijama čuvaju se onoliko dugo koliko to zahtevaju turski propisi o smeštaju i porezima. Poruke poslate putem kontakt forme i utisci gostiju brišu se nakon 24 meseca, osim ako nisu deo rezervacije."] },
      { heading: "Sa kim ih delimo", body: ["Samo sa pružaocima usluga koji nam pomažu u radu hostela (na primer, hosting provajder i partneri za ture koje zatražite) i sa nadležnim organima kada to zakon nalaže. Nikada ne prodajemo vaše podatke."] },
      { heading: "Vaša prava", body: ["U skladu sa turskim Zakonom o zaštiti podataka o ličnosti (KVKK) i, gde je primenljivo, Opštom uredbom EU o zaštiti podataka (GDPR), možete zatražiti pristup svojim podacima, njihovu ispravku ili brisanje, odnosno uložiti prigovor na njihovu upotrebu. Pišite nam na e-mail adresu navedenu na stranici za kontakt."] },
      { heading: "Kolačići", body: ["Koristimo samo neophodne kolačiće: jedan za pamćenje izabranog jezika i, ako se prijavite u vodič za goste, jedan kolačić sesije. Ne koristimo reklamne kolačiće niti kolačiće za praćenje."] },
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
  sr: {
    sections: [
      { heading: "Zahtevi za rezervaciju", body: ["Rezervacije napravljene na ovom sajtu su zahtevi. Rezervacija je potvrđena tek kada dobijete potvrdu od našeg tima na recepciji. Do tada dostupnost i cene nisu zagarantovane."] },
      { heading: "Plaćanje", body: ["Ništa se ne naplaćuje preko interneta. Potvrđeni iznos plaća se na recepciji po dolasku, karticom ili gotovinom. Boravišna taksa, gde je primenljiva, naplaćuje se posebno."] },
      { heading: "Otkazivanje", body: ["Rezervaciju možete besplatno otkazati najkasnije 48 sati pre datuma dolaska. Za kasnija otkazivanja i nedolazak može se naplatiti prva noć."] },
      { heading: "Prijava i identifikacija", body: ["Prijava je od 14:00, a odjava do 11:00. U skladu sa turskim zakonom, svi gosti pri prijavi moraju da pokažu važeći pasoš ili ličnu kartu. Gosti u spavaonicama moraju imati najmanje 18 godina."] },
      { heading: "Kućni red", body: ["Vreme tišine, zabrana pušenja i ostala pravila kućnog reda navedena u vodiču za goste važe za sve. Gostima koji ozbiljno ili ponovljeno krše pravila možemo prekinuti boravak bez povraćaja novca za preostale noći."] },
      { heading: "Ture i transferi", body: ["Doživljaji i transferi su zahtevi dok ih ne potvrdimo. Neke od njih organizuju partnerske kompanije, pa mogu važiti i njihovi uslovi. Prikazane cene su po osobi, osim ako je navedeno da su po grupi."] },
      { heading: "Odgovornost", body: ["Molimo vas da koristite obezbeđene ormariće. Ne odgovaramo za vredne stvari ostavljene van njih, osim ako zakon ne propisuje drugačije."] },
    ],
  },
};
