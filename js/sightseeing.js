/* Sightseeing: Detail-Popup je Sehenswürdigkeit
   ---------------------------------------------------------------
   Karten sind anklickbar; ein <dialog> zeigt Zusammenfassung,
   praktische Infos, Bild und weiterführende Links.

   Das Bild wird zur Laufzeit über die Wikipedia-/Wikimedia-API
   geladen (CORS via origin=*). Schlägt das fehl, bleibt der
   Platzhalter stehen — das Popup funktioniert auch ohne Netz.

   links:  recherchierte Quellen (offizielle Seiten, Reiseblogs)
   maps:   Google-Maps-Link; ohne Angabe aus coords erzeugt
   facts:  praktische Angaben (Eintritt, Öffnungszeiten, Anfahrt)
   todos:  Programmpunkte vor Ort, als [Titel, Beschreibung]
   note:   Hinweis, der hervorgehoben wird
*/

(function () {
  "use strict";

  var SIGHTS = {
    /* ---------------- Aberdeen ---------------- */

    "old-aberdeen": {
      title: "Old Aberdeen & King's College Chapel",
      tag: "Altstadt",
      coords: [57.1650, -2.0997],
      wiki: "en:King's College, Aberdeen",
      maps: "https://maps.google.com/?q=King%27s+College+Chapel+Aberdeen",
      summary:
        "Old Aberdeen war bis ins 19. Jahrhundert eine eigenständige Stadt und wirkt bis heute wie ein Dorf im " +
        "Stadtgebiet: kopfsteingepflasterte Gassen, niedrige Granithäuser, kaum Verkehr. Mittelpunkt ist die " +
        "King's College Chapel von 1509 mit ihrem charakteristischen Crown Tower — einer steinernen Krone auf dem " +
        "Turm, wie sie nur wenige Kirchen Schottlands tragen. Im Inneren steht das Grabmal von Bischof Elphinstone, " +
        "der die Universität 1495 gründete. Ein paar Minuten nördlich schließt die St Machar's Cathedral mit ihrer " +
        "bemalten Wappendecke an. Vom Zentrum sind es rund 30 Minuten zu Fuß die King Street hinauf — praktisch " +
        "vor der Haustür der Unterkunft.",
      facts: [
        ["Eintritt", "kostenlos"],
        ["Anfahrt", "ca. 30 Min. zu Fuß ab King Street"]
      ],
      links: [
        { label: "Offizielle Uni-Seite", note: "abdn.ac.uk", url: "https://www.abdn.ac.uk/about/campus/kings-college-chapel/" },
        { label: "Reiseführer", note: "britainexpress.com", url: "https://www.britainexpress.com/attractions.htm?attraction=1067" }
      ]
    },

    footdee: {
      title: 'Footdee („Fittie")',
      tag: "Küste",
      coords: [57.1442, -2.0723],
      wiki: "en:Footdee",
      maps: "https://maps.google.com/?q=Footdee+Aberdeen",
      summary:
        "Footdee, von Einheimischen „Fittie\" genannt, ist eine planmäßig angelegte Fischersiedlung von 1809 direkt " +
        "an der Hafeneinfahrt. Die winzigen Häuser stehen in geschlossenen Karrees mit den Rückseiten zum Meer — " +
        "als Schutz gegen die Nordseestürme. Zwischen den Reihen haben die Bewohner über Generationen bunt bemalte " +
        "Schuppen gebaut und die Wände mit Meeresglas und Treibgut verziert; Autos gibt es im Dorf nicht. Es wird " +
        "bis heute bewohnt: schauen ja, aber leise und nicht in die Fenster.",
      facts: [
        ["Eintritt", "kostenlos, frei zugänglich"],
        ["Öffnungszeiten", "keine — jederzeit"]
      ],
      links: [
        { label: "Reiseblog", note: "myhighlands.de", url: "https://www.myhighlands.de/en/footdee-aberdeen/" },
        { label: "Reisebericht", note: "adventuresaroundscotland.com", url: "https://www.adventuresaroundscotland.com/scotland-travel-blog/footdee" }
      ]
    },

    harbour: {
      title: "Aberdeen Harbour",
      tag: "Hafen",
      coords: [57.1430, -2.0800],
      wiki: "en:Port of Aberdeen",
      summary:
        "Der Hafen von Aberdeen ist seit 1136 urkundlich belegt und damit eines der ältesten durchgehend " +
        "betriebenen Unternehmen Großbritanniens. Heute ist er vor allem Versorgungsbasis für die " +
        "Nordsee-Ölplattformen, entsprechend liegen hier robuste Versorgungsschiffe statt Yachten. Von der " +
        "Landzunge bei Footdee lässt sich der Schiffsverkehr in der schmalen Einfahrt gut beobachten. Vor der " +
        "Hafenmündung lebt eine bekannte Population von Großen Tümmlern — mit etwas Geduld stehen die Chancen " +
        "auf Delfine gut.",
      facts: [["Eintritt", "kostenlos, frei zugänglich"]]
    },

    dunnottar: {
      title: "Dunnottar Castle",
      tag: "Tagesausflug",
      coords: [56.9459, -2.1971],
      wiki: "en:Dunnottar Castle",
      maps: "https://maps.google.com/?q=Dunnottar+Castle+Stonehaven",
      summary:
        "Die Ruine liegt auf einem fast vollständig freistehenden Felsplateau 50 Meter über der Nordsee und ist " +
        "nur über einen steilen Sattel erreichbar — die spektakulärste Burglage Schottlands. 1651/52 hielt eine " +
        "Handvoll Verteidiger hier monatelang Cromwells Truppen stand, während die schottischen Kronjuwelen in " +
        "der Anlage versteckt waren; sie wurden schließlich herausgeschmuggelt. Franco Zeffirelli drehte hier " +
        "1990 seine Hamlet-Verfilmung mit Mel Gibson. Der Abstieg zum Tor und wieder hinauf ist steil, festes " +
        "Schuhwerk lohnt sich.",
      facts: [
        ["Eintritt", "ca. £10"],
        ["Öffnungszeiten", "Apr–Sep 9:00–17:30 Uhr"],
        ["Anfahrt", "Bus X7 ab Aberdeen nach Stonehaven, dann 30 Min. Küstenweg"]
      ],
      links: [
        { label: "Offizielle Seite", note: "dunnottarcastle.co.uk", url: "https://www.dunnottarcastle.co.uk/" },
        { label: "Reiseguide", note: "castles-palaces.com", url: "https://www.castles-palaces.com/castles/scotland/dunnottar-castle" }
      ]
    },

    /* ---------------- Inverness ---------------- */

    "inverness-castle": {
      title: "Inverness Castle Experience",
      tag: "Neu 2026",
      coords: [57.4766, -4.2263],
      wiki: "en:Inverness Castle",
      maps: "https://maps.google.com/?q=Inverness+Castle",
      summary:
        "Das Castle über dem River Ness ist ein Gerichtsgebäude von 1836 an der Stelle mehrerer Vorgängerburgen. " +
        "Nach einem Umbau für 47 Millionen Pfund hat es im Februar 2026 als „Inverness Castle Experience\" " +
        "wiedereröffnet: ein immersiv inszenierter Rundgang durch die Geschichte und Kultur der Highlands, verteilt " +
        "auf Multimedia-Ausstellungen in beiden Türmen. Oben liegt eine Dachterrasse mit Panorama über Inverness, " +
        "den Fluss und das Umland. Für uns ist es damit brandneu — die Anlage war jahrzehntelang nicht öffentlich " +
        "zugänglich.",
      facts: [
        ["Eintritt", "£20 online / £22 vor Ort"],
        ["Öffnungszeiten", "10:00–17:00 Uhr"]
      ],
      links: [
        { label: "Offizielle Seite", note: "invernesscastle.scot", url: "https://www.invernesscastle.scot/" },
        { label: "Ehrlicher Reisebericht", note: "theemptynestexplorers.com", url: "https://www.theemptynestexplorers.com/inverness-castle-experience-worth-it" }
      ]
    },

    "river-ness": {
      title: "River Ness Walk",
      tag: "Stadt",
      coords: [57.4720, -4.2320],
      wiki: "en:River Ness",
      maps: "https://maps.google.com/?q=River+Ness+Inverness",
      summary:
        "Der River Ness verbindet Loch Ness mit dem Moray Firth und teilt Inverness in zwei Hälften. Der Uferweg " +
        "führt vom Stadtzentrum rund zwei Kilometer flussaufwärts bis zu den Ness Islands, einer Kette bewaldeter " +
        "Flussinseln, die seit dem 19. Jahrhundert durch viktorianische Hängebrücken verbunden sind. Unterwegs " +
        "liegen die Inverness Cathedral und die Greig Street Bridge von 1881, wegen ihres Schwingens allgemein nur " +
        "„Bouncy Bridge\" genannt. Der Weg ist flach und durchgehend befestigt — ein ruhiger Rundgang von etwa " +
        "einer Stunde.",
      facts: [
        ["Eintritt", "kostenlos"],
        ["Strecke", "ca. 2 km, flach und gepflastert"]
      ],
      links: [
        { label: "Wander-Guide", note: "highlandexplorer.scot", url: "https://highlandexplorer.scot/blog/inverness-river-ness-walk-guide" }
      ]
    },

    "loch-ness-trail": {
      title: "South Loch Ness Trail",
      tag: "Wanderung",
      coords: [57.2496, -4.4914],
      wiki: "en:Loch Ness",
      maps: "https://maps.google.com/?q=Foyers+Loch+Ness",
      summary:
        "Die geplante Etappe führt über offenes Moor und Heidelandschaft in dichten Nadelwald — laut Komoot-Nutzern " +
        "vor allem wegen des Duftes ein Höhepunkt — und weiter hinunter zur Foyers Bay mit ihrem Kiesstrand am " +
        "stillen Südufer von Loch Ness. Unterwegs liegen eine Seilschaukel und der South Loch Ness Tunnel. Bei " +
        "Foyers stürzt der Falls of Foyers in eine bewaldete Schlucht, ein lohnender Abstecher direkt an der " +
        "Strecke. Das Moor hält Nässe lange, wasserdichte Schuhe und Wechselkleidung sind auch bei gutem Wetter " +
        "sinnvoll.",
      facts: [
        ["Strecke", "15,8 km · 390 Hm · schwierig"],
        ["Dauer", "ca. 5–6 Stunden"],
        ["Anfahrt", "Bus 302 ab Inverness nach Foyers, ca. 1 Std."]
      ],
      links: [
        {
          label: "Komoot-Tour",
          note: "komoot.com",
          url: "https://www.komoot.com/tour/3091298275?share_token=afX9f9H9KsuinnRdtXRdiW5yBOV7ynvk35whkNdhzB718P6arz"
        }
      ]
    },

    kyle: {
      title: "Kyle of Lochalsh",
      tag: "Option",
      coords: [57.2796, -5.7132],
      wiki: "en:Kyle of Lochalsh",
      summary:
        "Die Kyle Line von Inverness quer durch die Highlands bis an die Westküste gilt als eine der schönsten " +
        "Bahnstrecken Großbritanniens: gut zweieinhalb Stunden durch Glen Carron, vorbei an Lochs und Bergketten " +
        "bis ans Meer. Am Endpunkt liegt die Skye Bridge, die seit 1995 zur Isle of Skye führt und heute mautfrei " +
        "ist. Wenige Kilometer vorher steht Eilean Donan Castle, die meistfotografierte Burg des Landes, " +
        "allerdings nur mit dem Bus erreichbar. Als Tagesausflug bleiben knapp sechs Stunden vor Ort — genug für " +
        "die Skye Bridge, den Hafen, ein ausgiebiges Mittagessen und einen Abstecher nach Skye hinüber.",
      facts: [
        ["Hinfahrt", "08:53 ab Inverness, an 11:31 · 2 Std. 38 Min."],
        ["Vor Ort", "5 Std. 40 Min."],
        ["Rückfahrt", "17:13 ab Kyle, an 19:59 · 2 Std. 46 Min."]
      ],
      todos: [
        ["The Plock (Cnoc Trail)",
         "Gemeinschaftlich verwaltetes Naturreservat auf der Halbinsel über dem Dorf — ein ehemaliger " +
         "Golfplatz, den sich die Natur zurückgeholt hat, mit gut gepflegten Wegen. Rund eine Stunde " +
         "hinauf zu den Aussichtspunkten, dafür Panorama über Skye Bridge, die Cuillins und den Loch. " +
         "Von allen Optionen das beste Verhältnis von Aufwand zu Aussicht."],
        ["Über die Skye Bridge laufen",
         "Ein asphaltierter Fußweg führt über die gesamte Brücke, von der Main Street beziehungsweise " +
         "Station Road in Kyle bis zum Kreisverkehr in Kyleakin auf Skye. Die beiden Spannbögen geben in " +
         "jede Richtung Panorama frei, unterwegs blickt man auf das weiß getünchte Häuschen auf Eilean Bàn " +
         "hinunter, und mit etwas Glück spielen Otter am Ufer. Flach und einfach — gut mit einem " +
         "Mittagessen auf der Skye-Seite zu verbinden."],
        ["Eilean Bàn",
         "Die kleine Insel unter der Brücke, einst Wohnsitz des Naturforschers Gavin Maxwell " +
         "(„Ring of Bright Water“). Von der Brücke aus gut zu sehen. Führungen auf die Insel gibt es, " +
         "sie müssen aber vorab gebucht werden — ohne Anmeldung also eher aus der Ferne."]
      ],
      note: "Mögliche Alternative zur Loch-Ness-Wanderung am Montag, 07.09. Ein Ablaufvorschlag steht in der Agenda.",
      links: [
        { label: "The Plock", note: "Karte", url: "https://www.google.com/maps/search/?api=1&query=The+Plock+Kyle+of+Lochalsh" },
        { label: "Skye Bridge", note: "Karte", url: "https://www.google.com/maps/search/?api=1&query=Skye+Bridge+Kyle+of+Lochalsh" }
      ]
    },

    /* ---------------- Glasgow & Stirling ---------------- */

    kelvingrove: {
      title: "Kelvingrove Art Gallery",
      tag: "Museum · kostenlos",
      coords: [55.8686, -4.2907],
      wiki: "en:Kelvingrove Art Gallery and Museum",
      maps: "https://maps.google.com/?q=Kelvingrove+Art+Gallery+Glasgow",
      summary:
        "Glasgows meistbesuchtes Museum residiert seit 1901 in einem üppigen Sandsteinbau im spanisch-barocken Stil " +
        "am Rand des Kelvingrove Park. Die 22 Galerien mischen alte Meister, schottische Kunst und Naturgeschichte — " +
        "Höhepunkte sind Salvador Dalís „Christus des Johannes vom Kreuz\", eine Sammlung zu Charles Rennie " +
        "Mackintosh und eine im Hauptsaal aufgehängte Spitfire aus dem Zweiten Weltkrieg. Hartnäckig hält sich die " +
        "Legende, das Gebäude sei versehentlich verkehrt herum gebaut worden — sie stimmt nicht.",
      facts: [
        ["Eintritt", "kostenlos"],
        ["Öffnungszeiten", "täglich 10:00–17:00 Uhr"],
        ["Anfahrt", "Busse 2, 3 und 77 halten direkt davor"]
      ],
      links: [
        { label: "Offizielle Seite", note: "glasgowlife.org.uk", url: "https://www.glasgowlife.org.uk/museums/venues/kelvingrove-art-gallery-and-museum" },
        { label: "Reiseführer", note: "roughguides.com", url: "https://www.roughguides.com/scotland/glasgow/kelvingrove-art-gallery-museum/" }
      ]
    },

    riverside: {
      title: "Riverside Museum",
      tag: "Museum",
      coords: [55.8654, -4.3095],
      wiki: "en:Riverside Museum",
      summary:
        "Das Verkehrsmuseum von Glasgow steht seit 2011 in einem markanten Zickzack-Bau von Zaha Hadid dort, wo " +
        "Kelvin und Clyde zusammenfließen. Gezeigt werden Lokomotiven, Straßenbahnen, Oldtimer und eine " +
        "nachgebaute Straße aus den 1930ern, die an Glasgows Vergangenheit als Zentrum des Schiff- und " +
        "Maschinenbaus erinnert. Direkt am Kai liegt die Glenlee, ein 1896 in Port Glasgow gebauter Dreimaster, " +
        "der besichtigt werden kann.",
      facts: [["Eintritt", "kostenlos"]],
      links: [
        { label: "Betreiber", note: "glasgowlife.org.uk", url: "https://www.glasgowlife.org.uk" }
      ]
    },

    "west-end": {
      title: "West End & Merchant City",
      tag: "Viertel",
      coords: [55.8740, -4.2930],
      wiki: "en:West End, Glasgow",
      summary:
        "Zwei Viertel mit sehr unterschiedlichem Charakter. Das West End rund um die neugotische Universität ist " +
        "studentisch geprägt: viktorianische Terrassenhäuser, die Cafés und Pubs der Ashton Lane in einer " +
        "kopfsteingepflasterten Gasse und die gläsernen Kibble Palace-Gewächshäuser der Botanic Gardens. Die " +
        "Merchant City im Zentrum, direkt am Airbnb, war im 18. Jahrhundert das Lagerhausviertel der Tabak- und " +
        "Zuckerhändler; die schweren Kaufmannsbauten beherbergen heute Restaurants und Galerien. Dazwischen liegt " +
        "der George Square mit den prunkvollen City Chambers.",
      facts: [["Eintritt", "kostenlos, frei zugänglich"]]
    },

    cathedral: {
      title: "Glasgow Cathedral & Necropolis",
      tag: "Historie",
      coords: [55.8629, -4.2350],
      wiki: "en:Glasgow Cathedral",
      maps: "https://maps.google.com/?q=Glasgow+Cathedral+and+Necropolis",
      summary:
        "Die Kathedrale ist die vollständigste erhaltene mittelalterliche Kathedrale des schottischen Festlands — " +
        "sie überstand die Reformation praktisch unbeschädigt. Sehenswert ist vor allem die Gruft mit dem Grab des " +
        "Stadtheiligen St Mungo, ein dicht bewaldeter Raum aus Bündelpfeilern und Rippengewölben. Gleich dahinter " +
        "steigt die Necropolis an, ein viktorianischer Hügelfriedhof mit rund 3.500 Monumenten nach dem Vorbild des " +
        "Pariser Père-Lachaise; der Zugang führt über die Bridge of Sighs. Von oben hat man den besten freien Blick " +
        "über die Stadt, der Aufstieg dauert etwa zehn Minuten.",
      facts: [
        ["Eintritt", "beide kostenlos"],
        ["Öffnungszeiten", "Kathedrale Mo–Sa 9:30–17:00 Uhr"]
      ],
      links: [
        { label: "Kathedrale", note: "historicenvironment.scot", url: "https://www.historicenvironment.scot/visit-a-place/places/glasgow-cathedral/" },
        { label: "Necropolis-Guide", note: "glasgowtourism.org", url: "https://www.glasgowtourism.org/glasgow-necropolis/" }
      ]
    },

    "stirling-castle": {
      title: "Stirling Castle",
      tag: "Tagesausflug",
      coords: [56.1239, -3.9470],
      wiki: "en:Stirling Castle",
      maps: "https://maps.google.com/?q=Stirling+Castle",
      summary:
        "Stirling kontrollierte jahrhundertelang den einzigen praktikablen Übergang zwischen Lowlands und " +
        "Highlands — wer die Burg auf ihrem Vulkanfelsen hielt, hielt Schottland. Entsprechend wurde hier zweimal " +
        "Geschichte geschrieben: 1297 an der Stirling Bridge und 1314 bei Bannockburn. Heute ist die Anlage vor " +
        "allem Renaissance-Residenz der Stuarts: der Königspalast, in dem Mary Queen of Scots ihre Kindheit " +
        "verbrachte, der Great Hall und eine Tapisserie-Werkstatt, in der Wandteppiche nach historischem Vorbild " +
        "gewebt werden. Kostümierte Darsteller führen durch die Räume.",
      facts: [
        ["Eintritt", "£18,50 online"],
        ["Öffnungszeiten", "täglich geöffnet"],
        ["Anfahrt", "35 Min. Zug ab Glasgow Queen Street, dann 20 Min. zu Fuß bergauf"]
      ],
      links: [
        { label: "Offizielle Seite", note: "stirlingcastle.scot", url: "https://www.stirlingcastle.scot/" },
        { label: "Reisebericht", note: "secret-scotland.com", url: "https://www.secret-scotland.com/place/stirling-castle" }
      ]
    },

    edinburgh: {
      title: "Edinburgh",
      tag: "Option statt Stirling",
      coords: [55.9520, -3.1900],
      wiki: "en:Edinburgh",
      maps: "https://maps.google.com/?q=Edinburgh+Waverley",
      summary:
        "Edinburgh ist als Ziel ungleich größer und dichter als Stirling: das Castle auf dem Burgfelsen, die " +
        "Royal Mile hinunter nach Holyrood, die mittelalterliche Old Town neben der streng geplanten " +
        "georgianischen New Town — beide zusammen seit 1995 UNESCO-Welterbe. Dazu Museen, Restaurants und " +
        "Stadtleben in ganz anderer Dichte. Der Preis dafür ist mehr Lauferei und mehr Andrang; im September " +
        "ist der große Fringe-Ansturm zwar vorbei, voll ist die Altstadt trotzdem. Und an einem einzigen Tag " +
        "bleibt es ein Anreißen statt eines richtigen Kennenlernens. Kurz: Stirling ist das kompaktere und " +
        "ruhigere Erlebnis, Edinburgh das reichere.",
      facts: [
        ["Anfahrt", "50 Min. bis 1 Std. 20 ab Glasgow Queen Street, je nach Verbindung"],
        ["Vor Ort", "bequem 7–8 Std."],
        ["Eintritt", "Castle kostenpflichtig · Royal Mile, Arthur's Seat und die großen Museen frei"]
      ],
      todos: [
        ["Edinburgh Castle",
         "Auf dem Vulkanfelsen über der Stadt, mit den schottischen Kronjuwelen und dem Stone of Scone. " +
         "Der meistbesuchte Ort Schottlands — Tickets vorab sichern, sonst geht Zeit in der Schlange verloren."],
        ["Royal Mile & Old Town",
         "Die Achse vom Castle hinunter zum Holyrood Palace, mit den engen Closes und Wynds links und rechts. " +
         "Gleich daneben die georgianische New Town mit ihren geraden Straßenzügen — der Kontrast der beiden " +
         "ist der eigentliche Reiz."],
        ["Arthur's Seat",
         "Erloschener Vulkan mitten in der Stadt und die eigentliche Wanderung hier: mäßig anstrengend, " +
         "2 bis 3 Stunden hin und zurück, dafür der beste Rundblick über Edinburgh, den Firth of Forth und " +
         "bei klarer Sicht bis zu den Highlands."]
      ],
      note: "Alternative zum Tagesausflug nach Stirling am Mittwoch, 09.09. — beides an einem Tag geht nicht."
    },

    wallace: {
      title: "National Wallace Monument",
      tag: "Tagesausflug",
      coords: [56.1385, -3.9195],
      wiki: "en:National Wallace Monument",
      maps: "https://maps.google.com/?q=National+Wallace+Monument+Stirling",
      summary:
        "Der 67 Meter hohe viktorianische Turm von 1869 steht auf dem Abbey Craig, von wo aus William Wallace vor " +
        "der Schlacht von Stirling Bridge die englischen Truppen beobachtet haben soll. Im Inneren führen 246 enge " +
        "Wendeltreppenstufen über drei Ausstellungsebenen nach oben; ausgestellt ist unter anderem ein 1,63 Meter " +
        "langes Schwert, das Wallace zugeschrieben wird. Von der Krone reicht der Blick über die Windungen des " +
        "Forth bis zu den Bergen der Highlands. Der Weg vom Parkplatz zum Turm ist steil, ein Shuttlebus fährt " +
        "hinauf.",
      facts: [
        ["Eintritt", "ca. £11"],
        ["Aufstieg", "246 Stufen"],
        ["Anfahrt", "10 Min. von Stirling Castle — gut an einem Tag kombinierbar"]
      ],
      links: [
        { label: "Offizielle Seite", note: "nationalwallacemonument.com", url: "https://www.nationalwallacemonument.com/" }
      ]
    },

    /* ---------------- London ---------------- */

    hamilton: {
      title: "Hamilton Musical",
      tag: "Highlight · 12.09. 19:30",
      coords: [51.4966, -0.1428],
      wiki: "en:Hamilton (musical)",
      maps: "https://maps.google.com/?q=Victoria+Palace+Theatre+London",
      summary:
        "Lin-Manuel Mirandas Musical erzählt das Leben des US-Gründervaters Alexander Hamilton in Hip-Hop, R&B und " +
        "klassischem Broadway — mit bewusst divers besetztem Ensemble. Das Stück gewann 2016 elf Tony Awards und " +
        "den Pulitzerpreis für Drama und läuft in London seit 2017 im eigens dafür umgebauten Victoria Palace " +
        "Theatre. Die Vorstellung dauert rund zweidreiviertel Stunden inklusive Pause.",
      facts: [
        ["Termin", "Sa 12.09.2026, 19:30 Uhr"],
        ["Tickets", "2 Plätze vorhanden · Ref. TFJ55FB"],
        ["Adresse", "Victoria Street SW1E 5EA, 2 Min. ab Victoria Station"]
      ],
      note: "Essen und Getränke von außen sind nicht erlaubt. Wer zu spät kommt, wird unter Umständen erst zur Pause eingelassen — rechtzeitig da sein.",
      links: [
        { label: "Offizielle Seite", note: "hamiltonmusical.com", url: "https://www.hamiltonmusical.com/london/" },
        { label: "Theater & Buchung", note: "delfontmackintosh.co.uk", url: "https://www.delfontmackintosh.co.uk" }
      ]
    },

    camden: {
      title: "Camden Market & Regent's Canal",
      tag: "Viertel",
      coords: [51.5414, -0.1465],
      wiki: "en:Camden Market",
      maps: "https://maps.google.com/?q=Camden+Market+London",
      summary:
        "Was 1974 als kleiner Handwerkermarkt begann, ist heute ein Geflecht mehrerer Märkte mit über tausend " +
        "Ständen und einer der meistbesuchten Orte Londons. In den Stables Markets, den ehemaligen Pferdeställen " +
        "und Backsteintunneln des Eisenbahnbetriebs, stehen Vintage-Läden und Streetfood-Stände dicht an dicht, " +
        "dazu Livemusik. Direkt daneben liegt der Camden Lock am Regent's Canal von 1820. Am Kanal entlang führt " +
        "ein Treidelpfad in etwa 45 Minuten durch den Regent's Park bis nach Little Venice — die ruhige " +
        "Alternative zum Marktgedränge und praktisch vor der Airbnb-Tür.",
      facts: [
        ["Eintritt", "kostenlos"],
        ["Öffnungszeiten", "täglich 10:00–18:00 Uhr"]
      ],
      links: [
        { label: "Offizielle Seite", note: "camdenmarket.com", url: "https://www.camdenmarket.com/" }
      ]
    },

    "south-bank": {
      title: "South Bank & Tate Modern",
      tag: "Kultur",
      coords: [51.5076, -0.0994],
      wiki: "en:Tate Modern",
      maps: "https://maps.google.com/?q=Tate+Modern+London",
      summary:
        "Die South Bank ist Londons kulturelle Uferpromenade: vom London Eye führt der Weg am Southbank Centre und " +
        "dem nachgebauten Shakespeare's Globe vorbei bis zur Tate Modern. Das Museum für moderne Kunst zog 2000 in " +
        "das stillgelegte Kraftwerk Bankside — die Turbinenhalle allein ist 155 Meter lang und wird für monumentale " +
        "Installationen genutzt. Die Sammlung mit Picasso, Rothko und Warhol ist frei zugänglich. Vor dem Eingang " +
        "beginnt die Millennium Bridge, die schnurgerade auf die St Paul's Cathedral zuläuft.",
      facts: [
        ["Eintritt", "kostenlos · Sonderausstellungen kostenpflichtig"],
        ["Öffnungszeiten", "täglich 10:00–18:00 Uhr"]
      ],
      links: [
        { label: "Offizielle Seite", note: "tate.org.uk", url: "https://www.tate.org.uk/visit/tate-modern" }
      ]
    },

    borough: {
      title: "Borough Market",
      tag: "Kulinarik",
      coords: [51.5055, -0.0910],
      wiki: "en:Borough Market",
      maps: "https://maps.google.com/?q=Borough+Market+London",
      summary:
        "An dieser Stelle wird seit dem 12. Jahrhundert Handel getrieben, was den Borough Market zu einem der " +
        "ältesten Lebensmittelmärkte Londons macht. Unter den gusseisernen viktorianischen Hallendächern und den " +
        "Eisenbahnbögen der London Bridge verkaufen rund 100 Händler Käse, Austern, Wild und Gebäck; dazwischen " +
        "stehen Stände mit warmem Essen zum Mitnehmen. Am späten Vormittag wird es sehr voll — früh dort zu sein " +
        "lohnt sich. Bis zur Tower Bridge sind es von hier gut zehn Minuten am Fluss entlang.",
      facts: [
        ["Eintritt", "kostenlos"],
        ["Öffnungszeiten", "Mo–Sa · sonntags geschlossen"]
      ],
      note: "Achtung, Terminkonflikt: Im Reiseplan steht der Markt am Sonntag, 13.09. — da ist er geschlossen. Besser auf Samstag, 12.09. vorziehen.",
      links: [
        { label: "Offizielle Seite", note: "boroughmarket.org.uk", url: "https://boroughmarket.org.uk/" }
      ]
    },

    "tower-bridge": {
      title: "Tower Bridge",
      tag: "Wahrzeichen",
      coords: [51.5055, -0.0754],
      wiki: "en:Tower Bridge",
      summary:
        "Die 1894 eröffnete Klappbrücke ist keineswegs die London Bridge, mit der sie ständig verwechselt wird. " +
        "Ihre neugotische Verkleidung war eine Auflage, damit sie neben dem Tower of London nicht zu industriell " +
        "wirkt — darunter steckt eine Stahlkonstruktion. Die Fahrbahn öffnet sich noch immer für hohe Schiffe, " +
        "rund 800 Mal im Jahr; die Termine werden vorab veröffentlicht. Kostenpflichtig begehbar sind die oberen " +
        "Verbindungsstege mit Glasboden über der Themse sowie die alten Dampfmaschinenräume.",
      facts: [
        ["Eintritt", "Brücke kostenlos · Ausstellung kostenpflichtig"]
      ],
      links: [
        { label: "Offizielle Seite", note: "towerbridge.org.uk", url: "https://www.towerbridge.org.uk" }
      ]
    }
  };

  /* ---- Elemente ----------------------------------------------- */
  var modal = document.getElementById("sight-modal");
  var cards = document.querySelectorAll("[data-sight]");
  if (!modal || !cards.length) return;

  var elTag = document.getElementById("modal-tag");
  var elTitle = document.getElementById("sight-modal-title");
  var elSummary = document.getElementById("modal-summary");
  var elFacts = document.getElementById("modal-facts");
  var elNote = document.getElementById("modal-note");
  var elTodosHead = document.getElementById("modal-todos-head");
  var elTodos = document.getElementById("modal-todos");
  var elLinks = document.getElementById("modal-links");
  var elFigure = document.getElementById("modal-figure");
  var elCredit = document.getElementById("modal-credit");
  var btnClose = modal.querySelector(".modal-close");

  var imgCache = {};
  var currentId = null;

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function wikiParts(spec) {
    var i = spec.indexOf(":");
    return { lang: spec.slice(0, i), title: spec.slice(i + 1) };
  }

  function wikiUrl(spec) {
    var w = wikiParts(spec);
    return "https://" + w.lang + ".wikipedia.org/wiki/" + encodeURIComponent(w.title.replace(/ /g, "_"));
  }

  /* ---- Links zusammenstellen ---------------------------------- */

  function buildLinks(s) {
    var links = (s.links || []).slice();

    links.push({
      label: "Google Maps",
      note: "Lage & Anfahrt",
      url: s.maps || ("https://www.google.com/maps/search/?api=1&query=" +
                      encodeURIComponent(s.coords[0] + "," + s.coords[1]))
    });

    if (s.wiki) {
      links.push({ label: "Wikipedia", note: wikiParts(s.wiki).title, url: wikiUrl(s.wiki) });
    }

    /* Nur wo keine recherchierte Zweitquelle vorliegt: Suche nach Reiseberichten */
    if ((s.links || []).length < 2) {
      links.push({
        label: "Reiseberichte",
        note: "Blogs & Erfahrungen suchen",
        url: "https://www.google.com/search?q=" +
             encodeURIComponent(s.title + " Schottland Reisebericht blog")
      });
    }

    return links;
  }

  /* ---- Bild von Wikipedia nachladen --------------------------- */

  function showPlaceholder() {
    elFigure.classList.add("is-placeholder");
    elFigure.style.backgroundImage = "";
    elCredit.innerHTML = "";
  }

  function loadImage(id, s) {
    if (!s.wiki) { showPlaceholder(); return; }
    if (imgCache[id] !== undefined) { applyImage(id, imgCache[id], s); return; }

    var w = wikiParts(s.wiki);
    var api = "https://" + w.lang + ".wikipedia.org/w/api.php" +
      "?action=query&format=json&origin=*&prop=pageimages&pithumbsize=1000" +
      "&titles=" + encodeURIComponent(w.title);

    showPlaceholder();

    fetch(api)
      .then(function (r) { return r.ok ? r.json() : Promise.reject(new Error(r.status)); })
      .then(function (data) {
        var pages = (data.query && data.query.pages) || {};
        var src = null;
        Object.keys(pages).some(function (k) {
          if (pages[k].thumbnail && pages[k].thumbnail.source) { src = pages[k].thumbnail.source; return true; }
          return false;
        });
        imgCache[id] = src;
        applyImage(id, src, s);
      })
      .catch(function () {
        imgCache[id] = null;
        if (currentId === id) showPlaceholder();
      });
  }

  function applyImage(id, src, s) {
    if (currentId !== id) return;          // inzwischen wurde ein anderes Popup geöffnet
    if (!src) { showPlaceholder(); return; }
    elFigure.classList.remove("is-placeholder");
    elFigure.style.backgroundImage = 'url("' + src + '")';
    elCredit.innerHTML =
      'Bild: <a href="' + wikiUrl(s.wiki) + '" target="_blank" rel="noopener">Wikipedia / Wikimedia Commons</a>';
  }

  /* ---- Popup öffnen & schließen ------------------------------- */

  function open(id) {
    var s = SIGHTS[id];
    if (!s) return;
    currentId = id;

    elTag.textContent = s.tag || "";
    elTag.hidden = !s.tag;
    elTitle.textContent = s.title;
    elSummary.textContent = s.summary;

    elFacts.innerHTML = (s.facts || [])
      .map(function (f) {
        return "<dt>" + esc(f[0]) + "</dt><dd>" + esc(f[1]) + "</dd>";
      })
      .join("");
    elFacts.hidden = !(s.facts && s.facts.length);

    /* Programmpunkte vor Ort, falls hinterlegt */
    elTodos.innerHTML = (s.todos || [])
      .map(function (t) {
        return "<li><strong>" + esc(t[0]) + "</strong><span>" + esc(t[1]) + "</span></li>";
      })
      .join("");
    elTodos.hidden = !(s.todos && s.todos.length);
    elTodosHead.hidden = elTodos.hidden;

    elNote.textContent = s.note || "";
    elNote.hidden = !s.note;

    elLinks.innerHTML = buildLinks(s)
      .map(function (l) {
        return '<li><a href="' + esc(l.url) + '" target="_blank" rel="noopener">' +
               '<span class="l-label">' + esc(l.label) + "</span>" +
               '<span class="l-note">' + esc(l.note) + "</span></a></li>";
      })
      .join("");

    loadImage(id, s);

    if (typeof modal.showModal === "function") modal.showModal();
    else modal.setAttribute("open", "");     // sehr alte Browser
    modal.scrollTop = 0;
  }

  function close() {
    currentId = null;
    if (typeof modal.close === "function") modal.close();
    else modal.removeAttribute("open");
  }

  cards.forEach(function (card) {
    card.addEventListener("click", function () {
      open(card.getAttribute("data-sight"));
    });
  });

  btnClose.addEventListener("click", close);

  /* Klick auf den Hintergrund schließt (Backdrop zählt als Klick auf <dialog>) */
  modal.addEventListener("click", function (e) {
    if (e.target === modal) close();
  });

  modal.addEventListener("close", function () { currentId = null; });
})();
