import { SearchData, SearchSource } from "@/types";

const enc = encodeURIComponent;

// Only join non-empty values
const join = (...parts: (string | undefined)[]): string =>
  parts.filter((p) => p && p.trim() !== "").join(" ");

const slug = (...parts: (string | undefined)[]): string =>
  parts
    .filter((p) => p && p.trim() !== "")
    .join("-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

export const SEARCH_SOURCES: SearchSource[] = [
  // ── People Search (Truly Free) ──────────────────────────────────────────────
  {
    name: "FastPeopleSearch",
    url: "https://www.fastpeoplesearch.com",
    category: "People Search",
    description: "100% free — address, phone, email, relatives. No paywall.",
    icon: "👤",
    buildUrl: (d) => {
      const name = slug(d.firstName, d.lastName);
      const loc = d.state
        ? `/${d.city ? enc(d.city) + "_" : ""}${d.state.toUpperCase()}`
        : "";
      return name
        ? `https://www.fastpeoplesearch.com/name/${name}${loc}`
        : "https://www.fastpeoplesearch.com";
    },
  },
  {
    name: "TruePeopleSearch",
    url: "https://www.truepeoplesearch.com",
    category: "People Search",
    description: "Completely free people search — detailed profiles, no signup required.",
    icon: "🔍",
    buildUrl: (d) => {
      const params = new URLSearchParams();
      const name = join(d.firstName, d.lastName);
      const loc = join(d.city, d.state, d.zipCode);
      if (name) params.set("name", name);
      if (loc) params.set("citystatezip", loc);
      const qs = params.toString();
      return qs
        ? `https://www.truepeoplesearch.com/results?${qs}`
        : "https://www.truepeoplesearch.com";
    },
  },
  {
    name: "ThatsThem",
    url: "https://thatsthem.com",
    category: "People Search",
    description: "Truly free people finder — name, phone, email, address, IP lookup.",
    icon: "🔎",
    buildUrl: (d) => {
      const params = new URLSearchParams();
      if (d.firstName) params.set("firstname", d.firstName);
      if (d.lastName) params.set("lastname", d.lastName);
      if (d.city) params.set("city", d.city);
      if (d.state) params.set("state", d.state);
      if (d.zipCode) params.set("zip", d.zipCode);
      const qs = params.toString();
      return qs
        ? `https://thatsthem.com/people-search?${qs}`
        : "https://thatsthem.com";
    },
  },
  {
    name: "FamilyTreeNow",
    url: "https://www.familytreenow.com",
    category: "People Search",
    description: "Completely free — name, address history, relatives, age. No charge ever.",
    icon: "🌳",
    buildUrl: (d) => {
      const params = new URLSearchParams();
      if (d.firstName) params.set("firstname", d.firstName);
      if (d.lastName) params.set("lastname", d.lastName);
      if (d.state) params.set("state", d.state);
      if (d.city) params.set("city", d.city);
      const qs = params.toString();
      return qs
        ? `https://www.familytreenow.com/search/genealogy/results?${qs}`
        : "https://www.familytreenow.com";
    },
  },
  {
    name: "PeekYou",
    url: "https://www.peekyou.com",
    category: "People Search",
    description: "Free people search linking social profiles, web mentions, and contact info.",
    icon: "👁️",
    buildUrl: (d) => {
      if (d.username) return `https://www.peekyou.com/${enc(d.username)}`;
      const first = d.firstName ? enc(d.firstName.toLowerCase()) : "";
      const last = d.lastName ? enc(d.lastName.toLowerCase()) : "";
      if (!first && !last) return "https://www.peekyou.com";
      const loc = d.state ? `_${d.state.toLowerCase()}` : "";
      return `https://www.peekyou.com/${first}_${last}${loc}`;
    },
  },
  {
    name: "Webmii",
    url: "https://webmii.com",
    category: "People Search",
    description: "Free people search aggregator — scores web presence from 40+ sources.",
    icon: "🌐",
    buildUrl: (d) => {
      const first = d.firstName || "";
      const last = d.lastName || "";
      if (!first && !last) return "https://webmii.com";
      return `https://webmii.com/people?fn=${enc(first)}&ln=${enc(last)}`;
    },
  },
  {
    name: "SearchPeopleFree",
    url: "https://www.searchpeoplefree.com",
    category: "People Search",
    description: "100% free people search — address, phone, email with no paywall.",
    icon: "🆓",
    buildUrl: (d) => {
      const name = slug(d.firstName, d.lastName);
      if (!name) return "https://www.searchpeoplefree.com";
      return d.state
        ? `https://www.searchpeoplefree.com/find/${name}/${d.state.toLowerCase()}`
        : `https://www.searchpeoplefree.com/find/${name}`;
    },
  },
  {
    name: "Addresses.com",
    url: "https://www.addresses.com",
    category: "People Search",
    description: "Free address and people search with no registration required.",
    icon: "📍",
    buildUrl: (d) => {
      const name = join(d.firstName, d.lastName);
      if (!name) return "https://www.addresses.com";
      const params = new URLSearchParams();
      params.set("sname", name);
      if (d.city) params.set("scity", d.city);
      if (d.state) params.set("sstate", d.state);
      return `https://www.addresses.com/people.php?${params.toString()}`;
    },
  },

  // ── Social Media & Online ───────────────────────────────────────────────────
  {
    name: "LinkedIn Search",
    url: "https://www.linkedin.com",
    category: "Social & Web",
    description: "Free search for professional profiles, employers, and work history.",
    icon: "💼",
    buildUrl: (d) => {
      const q = join(d.firstName, d.lastName, d.employer, d.jobTitle);
      return q
        ? `https://www.linkedin.com/search/results/people/?keywords=${enc(q)}`
        : "https://www.linkedin.com/search/results/people/";
    },
  },
  {
    name: "Facebook Search",
    url: "https://www.facebook.com",
    category: "Social & Web",
    description: "Free search of public Facebook profiles and pages.",
    icon: "📘",
    buildUrl: (d) => {
      const q = join(d.firstName, d.lastName);
      return q
        ? `https://www.facebook.com/search/people/?q=${enc(q)}`
        : "https://www.facebook.com/search/people/";
    },
  },
  {
    name: "Twitter / X Search",
    url: "https://x.com",
    category: "Social & Web",
    description: "Free search of public tweets and user profiles on X.",
    icon: "🐦",
    buildUrl: (d) => {
      if (d.twitterHandle) return `https://x.com/${d.twitterHandle.replace("@", "")}`;
      const q = join(d.firstName, d.lastName);
      return q ? `https://x.com/search?q=${enc(q)}&f=user` : "https://x.com/search?f=user";
    },
  },
  {
    name: "Instagram",
    url: "https://www.instagram.com",
    category: "Social & Web",
    description: "Free lookup of public Instagram profiles by handle.",
    icon: "📸",
    buildUrl: (d) =>
      d.instagramHandle
        ? `https://www.instagram.com/${d.instagramHandle.replace("@", "")}/`
        : "https://www.instagram.com/explore/",
  },
  {
    name: "TikTok Search",
    url: "https://www.tiktok.com",
    category: "Social & Web",
    description: "Free search of public TikTok user accounts.",
    icon: "🎵",
    buildUrl: (d) => {
      if (d.tiktokHandle) return `https://www.tiktok.com/@${d.tiktokHandle.replace("@", "")}`;
      const q = join(d.firstName, d.lastName);
      return q
        ? `https://www.tiktok.com/search/user?q=${enc(q)}`
        : "https://www.tiktok.com";
    },
  },
  {
    name: "Reddit Search",
    url: "https://www.reddit.com",
    category: "Social & Web",
    description: "Free search of public Reddit user profiles and posts.",
    icon: "🤖",
    buildUrl: (d) => {
      if (d.redditUsername) return `https://www.reddit.com/user/${d.redditUsername.replace("u/", "")}`;
      const q = join(d.firstName, d.lastName);
      return q
        ? `https://www.reddit.com/search/?q=${enc(q)}&type=user`
        : "https://www.reddit.com/search/?type=user";
    },
  },
  {
    name: "GitHub",
    url: "https://github.com",
    category: "Social & Web",
    description: "Free search of developer profiles and public repositories.",
    icon: "💻",
    buildUrl: (d) => {
      if (d.githubUsername) return `https://github.com/${d.githubUsername}`;
      const q = join(d.firstName, d.lastName);
      return q
        ? `https://github.com/search?q=${enc(q)}&type=users`
        : "https://github.com/search?type=users";
    },
  },
  {
    name: "Namechk",
    url: "https://namechk.com",
    category: "Social & Web",
    description: "Free — checks a username across 100+ social networks simultaneously.",
    icon: "🔑",
    buildUrl: (d) =>
      d.username ? `https://namechk.com/${enc(d.username)}` : "https://namechk.com",
  },
  {
    name: "Sherlock (GitHub)",
    url: "https://github.com/sherlock-project/sherlock",
    category: "Social & Web",
    description: "Free open-source tool to hunt a username across 400+ social networks.",
    icon: "🕵️",
    buildUrl: () => "https://github.com/sherlock-project/sherlock",
  },
  {
    name: "Google People Search",
    url: "https://www.google.com",
    category: "Social & Web",
    description: "Free Google search targeting name + location for public info.",
    icon: "🌍",
    buildUrl: (d) => {
      const parts = [d.firstName, d.lastName, d.city, d.state, d.employer].filter(Boolean);
      if (parts.length === 0) return "https://www.google.com";
      return `https://www.google.com/search?q=${enc('"' + parts.join(" ") + '"')}`;
    },
  },
  {
    name: "Bing People Search",
    url: "https://www.bing.com",
    category: "Social & Web",
    description: "Free Bing search with people filter to surface public profiles.",
    icon: "🔵",
    buildUrl: (d) => {
      const q = join(d.firstName, d.lastName, d.city, d.state);
      return q
        ? `https://www.bing.com/search?q=${enc(q + " public profile")}`
        : "https://www.bing.com";
    },
  },

  // ── Court & Legal Records (All Free/Government) ─────────────────────────────
  {
    name: "CourtListener",
    url: "https://www.courtlistener.com",
    category: "Court & Legal",
    description: "Free access to millions of federal & state legal opinions and court records.",
    icon: "⚖️",
    buildUrl: (d) => {
      const q = join(d.firstName, d.lastName);
      return q
        ? `https://www.courtlistener.com/?q=${enc(q)}&type=people`
        : "https://www.courtlistener.com/?type=people";
    },
  },
  {
    name: "VINELink",
    url: "https://vinelink.vineapps.com",
    category: "Court & Legal",
    description: "Free government victim notification — offender custody status by state.",
    icon: "🔒",
    buildUrl: (d) =>
      d.state
        ? `https://vinelink.vineapps.com/search/${enc(d.state)}`
        : "https://vinelink.vineapps.com",
  },
  {
    name: "National Sex Offender Registry",
    url: "https://www.nsopw.gov",
    category: "Court & Legal",
    description: "Official U.S. government — free National Sex Offender Public Website.",
    icon: "⚠️",
    buildUrl: (d) => {
      const params = new URLSearchParams();
      if (d.firstName) params.set("firstName", d.firstName);
      if (d.lastName) params.set("lastName", d.lastName);
      if (d.state) params.set("state", d.state);
      const qs = params.toString();
      return qs ? `https://www.nsopw.gov/en/Search/Results?${qs}` : "https://www.nsopw.gov";
    },
  },
  {
    name: "BOP Federal Inmate Locator",
    url: "https://www.bop.gov/inmateloc/",
    category: "Court & Legal",
    description: "Free — Bureau of Prisons official federal inmate locator.",
    icon: "🏢",
    buildUrl: () => "https://www.bop.gov/inmateloc/",
  },
  {
    name: "Mugshots.com",
    url: "https://mugshots.com",
    category: "Court & Legal",
    description: "Free search of public arrest records and mugshot photos.",
    icon: "📷",
    buildUrl: (d) => {
      const q = join(d.firstName, d.lastName);
      return q ? `https://mugshots.com/search.html?q=${enc(q)}` : "https://mugshots.com";
    },
  },
  {
    name: "Black Book Online",
    url: "https://www.blackbookonline.info",
    category: "Court & Legal",
    description: "Free directory of government court records and criminal history by state.",
    icon: "📚",
    buildUrl: (d) =>
      d.state
        ? `https://www.blackbookonline.info/USA-${d.state.toUpperCase()}-Public-Records.aspx`
        : "https://www.blackbookonline.info",
  },
  {
    name: "Arrest.org",
    url: "https://arrest.org",
    category: "Court & Legal",
    description: "Free public arrest records and booking records search.",
    icon: "🚔",
    buildUrl: (d) => {
      const q = join(d.firstName, d.lastName);
      return q ? `https://arrest.org/search/?s=${enc(q)}` : "https://arrest.org";
    },
  },

  // ── Property & Assets (Free) ────────────────────────────────────────────────
  {
    name: "Zillow Property Search",
    url: "https://www.zillow.com",
    category: "Property & Assets",
    description: "Free property records — ownership, values, sales history, and tax data.",
    icon: "🏠",
    buildUrl: (d) => {
      if (d.propertyAddress) return `https://www.zillow.com/homes/${enc(d.propertyAddress)}_rb/`;
      const loc = slug(d.city, d.state);
      return loc ? `https://www.zillow.com/homes/${loc}/` : "https://www.zillow.com";
    },
  },
  {
    name: "NETR Online County Records",
    url: "https://publicrecords.netronline.com",
    category: "Property & Assets",
    description: "Free directory of county-level property assessors and recorder offices.",
    icon: "📋",
    buildUrl: (d) =>
      d.state
        ? `https://publicrecords.netronline.com/state/${enc(d.state)}`
        : "https://publicrecords.netronline.com",
  },
  {
    name: "Realtor.com",
    url: "https://www.realtor.com",
    category: "Property & Assets",
    description: "Free property ownership history, tax records, and sales data.",
    icon: "🏡",
    buildUrl: (d) => {
      if (d.propertyAddress) return `https://www.realtor.com/realestateandhomes-search/${enc(d.propertyAddress)}`;
      const loc = slug(d.city, d.state);
      return loc ? `https://www.realtor.com/realestateandhomes-search/${loc}` : "https://www.realtor.com";
    },
  },
  {
    name: "Property Shark",
    url: "https://www.propertyshark.com",
    category: "Property & Assets",
    description: "Free property owner lookup — name, ownership history, permits.",
    icon: "🦈",
    buildUrl: (d) => {
      if (d.propertyAddress) return `https://www.propertyshark.com/mason/en/property-search/${enc(d.propertyAddress)}`;
      if (d.city && d.state) return `https://www.propertyshark.com/mason/en/property-search/${enc(d.city + ", " + d.state)}`;
      return "https://www.propertyshark.com";
    },
  },

  // ── Phone & Email (Free) ────────────────────────────────────────────────────
  {
    name: "SpyDialer — Free Reverse Phone",
    url: "https://spydialer.com",
    category: "Phone & Email",
    description: "100% free reverse phone lookup — name, address, carrier. No account needed.",
    icon: "📱",
    buildUrl: (d) =>
      d.phoneNumber
        ? `https://spydialer.com/default.aspx?n=${d.phoneNumber.replace(/\D/g, "")}`
        : "https://spydialer.com",
  },
  {
    name: "NumLooker — Reverse Phone",
    url: "https://www.numlooker.com",
    category: "Phone & Email",
    description: "Completely free reverse phone lookup — owner name and location.",
    icon: "☎️",
    buildUrl: (d) =>
      d.phoneNumber
        ? `https://www.numlooker.com/phone/${d.phoneNumber.replace(/\D/g, "")}`
        : "https://www.numlooker.com",
  },
  {
    name: "CallerSmart",
    url: "https://www.callersmart.com",
    category: "Phone & Email",
    description: "Free reverse phone lookup powered by community reports and public data.",
    icon: "📞",
    buildUrl: (d) =>
      d.phoneNumber
        ? `https://www.callersmart.com/phone-lookup/${d.phoneNumber.replace(/\D/g, "")}`
        : "https://www.callersmart.com",
  },
  {
    name: "Reverse Phone by TruePeopleSearch",
    url: "https://www.truepeoplesearch.com",
    category: "Phone & Email",
    description: "Completely free reverse phone — shows name, address, relatives.",
    icon: "🔁",
    buildUrl: (d) =>
      d.phoneNumber
        ? `https://www.truepeoplesearch.com/results?phoneno=${d.phoneNumber.replace(/\D/g, "")}`
        : "https://www.truepeoplesearch.com",
  },
  {
    name: "Email Finder (ThatsThem)",
    url: "https://thatsthem.com",
    category: "Phone & Email",
    description: "Free email lookup — find people by email address at no cost.",
    icon: "📧",
    buildUrl: (d) =>
      d.email
        ? `https://thatsthem.com/email-lookup?email=${enc(d.email)}`
        : "https://thatsthem.com/email-lookup",
  },

  // ── Business & Employment (Free) ────────────────────────────────────────────
  {
    name: "OpenCorporates",
    url: "https://opencorporates.com",
    category: "Business & Employment",
    description: "World's largest free open database of companies and corporate officers.",
    icon: "📊",
    buildUrl: (d) => {
      const q = join(d.firstName, d.lastName);
      return q
        ? `https://opencorporates.com/officers?q=${enc(q)}&jurisdiction_code=us`
        : "https://opencorporates.com/officers?jurisdiction_code=us";
    },
  },
  {
    name: "LinkedIn Company Search",
    url: "https://www.linkedin.com",
    category: "Business & Employment",
    description: "Free search of company profiles and listed employees.",
    icon: "🏢",
    buildUrl: (d) => {
      if (d.employer)
        return `https://www.linkedin.com/search/results/companies/?keywords=${enc(d.employer)}`;
      const name = join(d.firstName, d.lastName);
      return name
        ? `https://www.linkedin.com/search/results/people/?keywords=${enc(name)}`
        : "https://www.linkedin.com/search/results/people/";
    },
  },
  {
    name: "ProPublica Nonprofit Explorer",
    url: "https://projects.propublica.org/nonprofits",
    category: "Business & Employment",
    description: "Free search of IRS 990 nonprofit filings — officers, compensation, financials.",
    icon: "🏛️",
    buildUrl: (d) => {
      const q = join(d.firstName, d.lastName, d.employer);
      return q
        ? `https://projects.propublica.org/nonprofits/search?q=${enc(q)}`
        : "https://projects.propublica.org/nonprofits";
    },
  },

  // ── Government Records (All Free) ──────────────────────────────────────────
  {
    name: "VoterRecords.com",
    url: "https://www.voterrecords.com",
    category: "Government Records",
    description: "Free voter registration lookup — name, address, party affiliation by state.",
    icon: "🗳️",
    buildUrl: (d) => {
      const name = slug(d.firstName, d.lastName);
      if (!name) return "https://www.voterrecords.com";
      return d.state
        ? `https://www.voterrecords.com/voter/${name}/${enc(d.state)}`
        : `https://www.voterrecords.com/voter/${name}`;
    },
  },
  {
    name: "PACER Bankruptcy Search",
    url: "https://pcl.uscourts.gov",
    category: "Government Records",
    description: "Official U.S. courts — free bankruptcy case search (account required, free).",
    icon: "💸",
    buildUrl: () => "https://pcl.uscourts.gov/pcl/pages/search/findBankruptcy.jsf",
  },
  {
    name: "OpenSecrets — Campaign Finance",
    url: "https://www.opensecrets.org",
    category: "Government Records",
    description: "Free FEC campaign contribution records — find political donations by name.",
    icon: "💰",
    buildUrl: (d) => {
      const q = join(d.firstName, d.lastName);
      return q
        ? `https://www.opensecrets.org/donor-lookup/results?name=${enc(q)}&state=${d.state || ""}`
        : "https://www.opensecrets.org/donor-lookup";
    },
  },
  {
    name: "FEC.gov — Political Donations",
    url: "https://www.fec.gov",
    category: "Government Records",
    description: "Official U.S. Election Commission — free search of all political contributions.",
    icon: "🏛️",
    buildUrl: (d) => {
      const params = new URLSearchParams();
      if (d.lastName) params.set("contributor_last_name", d.lastName);
      if (d.firstName) params.set("contributor_first_name", d.firstName);
      if (d.city) params.set("contributor_city", d.city);
      if (d.state) params.set("contributor_state", d.state);
      const qs = params.toString();
      return qs
        ? `https://www.fec.gov/data/receipts/individual-contributions/?${qs}`
        : "https://www.fec.gov/data/receipts/individual-contributions/";
    },
  },
  {
    name: "FamilySearch — Vital Records",
    url: "https://www.familysearch.org",
    category: "Government Records",
    description: "Free — world's largest genealogy database with birth, death, and marriage records.",
    icon: "📜",
    buildUrl: (d) => {
      const q = join(d.firstName, d.lastName);
      return q
        ? `https://www.familysearch.org/search/record/results?q.givenName=${enc(d.firstName || "")}&q.surname=${enc(d.lastName || "")}`
        : "https://www.familysearch.org/search";
    },
  },
  {
    name: "Find A Grave",
    url: "https://www.findagrave.com",
    category: "Government Records",
    description: "Free database of 200M+ burial records — confirms deceased status, birthdate.",
    icon: "🪦",
    buildUrl: (d) => {
      const params = new URLSearchParams();
      if (d.firstName) params.set("firstname", d.firstName);
      if (d.lastName) params.set("lastname", d.lastName);
      if (d.state) params.set("country", "4"); // US
      const qs = params.toString();
      return qs
        ? `https://www.findagrave.com/memorial/search?${qs}`
        : "https://www.findagrave.com/memorial/search";
    },
  },
  {
    name: "SSA Death Index (Ancestry Free)",
    url: "https://www.ancestry.com",
    category: "Government Records",
    description: "Free Social Security Death Index — confirms death, last known state.",
    icon: "📋",
    buildUrl: (d) => {
      const params = new URLSearchParams();
      if (d.firstName) params.set("name_x", `${d.firstName}_${d.lastName || ""}`);
      else if (d.lastName) params.set("name_x", d.lastName);
      params.set("db", "3693"); // SSDI database
      const qs = params.toString();
      return qs
        ? `https://www.ancestry.com/search/collections/3693/?${qs}`
        : "https://www.ancestry.com/search/collections/3693/";
    },
  },
];

export const CATEGORIES = [
  "All",
  "People Search",
  "Social & Web",
  "Court & Legal",
  "Property & Assets",
  "Phone & Email",
  "Business & Employment",
  "Government Records",
];
