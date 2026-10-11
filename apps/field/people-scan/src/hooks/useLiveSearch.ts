import { useState, useCallback } from "react";
import { SearchData } from "@/types";

export interface LiveResult {
  source: string;
  category: string;
  icon: string;
  status: "loading" | "success" | "error" | "empty";
  records: LiveRecord[];
  error?: string;
  directUrl?: string;
}

export interface LiveRecord {
  title: string;
  subtitle?: string;
  detail?: string;
  url?: string;
  tags?: string[];
  raw?: Record<string, unknown>;
}

const enc = encodeURIComponent;

async function fetchCourtListener(data: SearchData): Promise<LiveRecord[]> {
  const name = [data.firstName, data.lastName].filter(Boolean).join(" ");
  if (!name) return [];
  const url = `https://www.courtlistener.com/api/rest/v4/people/?name_last=${enc(data.lastName || "")}&name_first=${enc(data.firstName || "")}&format=json`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const results = json.results || [];
  return results.slice(0, 10).map((r: Record<string, unknown>) => ({
    title: `${r.name_first || ""} ${r.name_last || ""}`.trim() || "Unknown",
    subtitle: [r.court as string, r.position_type as string].filter(Boolean).join(" · "),
    detail: r.date_dob ? `DOB: ${r.date_dob}` : undefined,
    url: `https://www.courtlistener.com${r.absolute_url}`,
    tags: (r.political_affiliations as string[]) || [],
  }));
}

async function fetchCourtListenerDockets(data: SearchData): Promise<LiveRecord[]> {
  const name = [data.firstName, data.lastName].filter(Boolean).join(" ");
  if (!name) return [];
  const url = `https://www.courtlistener.com/api/rest/v4/dockets/?party_name=${enc(name)}&format=json&order_by=-date_filed`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const results = json.results || [];
  return results.slice(0, 15).map((r: Record<string, unknown>) => ({
    title: (r.case_name as string) || "Unnamed Case",
    subtitle: (r.court_id as string)?.toUpperCase() || "",
    detail: r.date_filed ? `Filed: ${r.date_filed}` : undefined,
    url: `https://www.courtlistener.com${r.absolute_url}`,
    tags: [r.nature_of_suit as string, r.cause as string].filter(Boolean),
  }));
}

async function fetchFEC(data: SearchData): Promise<LiveRecord[]> {
  if (!data.lastName && !data.firstName) return [];
  const params = new URLSearchParams({ api_key: "DEMO_KEY", per_page: "20", sort: "-contribution_receipt_amount" });
  if (data.lastName) params.set("contributor_last_name", data.lastName);
  if (data.firstName) params.set("contributor_first_name", data.firstName);
  if (data.city) params.set("contributor_city", data.city);
  if (data.state) params.set("contributor_state", data.state);
  if (data.zipCode) params.set("contributor_zip", data.zipCode);
  const url = `https://api.open.fec.gov/v1/schedules/schedule_a/?${params}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const results = json.results || [];
  return results.slice(0, 15).map((r: Record<string, unknown>) => ({
    title: `${r.contributor_first_name || ""} ${r.contributor_last_name || ""}`.trim(),
    subtitle: `$${(r.contribution_receipt_amount as number)?.toLocaleString() || "0"} → ${r.committee?.name || "Unknown Committee"}`,
    detail: [r.contributor_city as string, r.contributor_state as string].filter(Boolean).join(", "),
    url: `https://www.fec.gov/data/receipts/individual-contributions/?contributor_last_name=${enc(data.lastName || "")}&contributor_first_name=${enc(data.firstName || "")}`,
    tags: [r.contributor_employer as string, r.contributor_occupation as string].filter(Boolean),
  }));
}

async function fetchOpenCorporates(data: SearchData): Promise<LiveRecord[]> {
  const name = [data.firstName, data.lastName].filter(Boolean).join(" ");
  if (!name) return [];
  const url = `https://api.opencorporates.com/v0.4/officers/search?q=${enc(name)}&jurisdiction_code=us&per_page=20`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const officers = json.results?.officers || [];
  return officers.slice(0, 15).map((item: Record<string, unknown>) => {
    const o = item.officer as Record<string, unknown>;
    const company = o.company as Record<string, unknown>;
    return {
      title: (o.name as string) || name,
      subtitle: (o.position as string) ? `${o.position} @ ${company?.name || "Unknown Company"}` : (company?.name as string) || "",
      detail: [company?.jurisdiction_code as string, o.start_date as string ? `Since ${o.start_date}` : ""].filter(Boolean).join(" · "),
      url: `https://opencorporates.com${o.opencorporates_url || ""}`,
      tags: [company?.current_status as string, o.inactive ? "Inactive" : "Active"].filter(Boolean),
    };
  });
}

async function fetchProPublicaNonprofit(data: SearchData): Promise<LiveRecord[]> {
  const name = [data.firstName, data.lastName, data.employer].filter(Boolean).join(" ");
  if (!name) return [];
  const url = `https://projects.propublica.org/nonprofits/api/v2/search.json?q=${enc(name)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const orgs = json.organizations || [];
  return orgs.slice(0, 12).map((o: Record<string, unknown>) => ({
    title: (o.name as string) || "Unknown Org",
    subtitle: `EIN: ${o.ein || "N/A"} · ${o.state as string || ""}`,
    detail: o.ntee_code ? `NTEE: ${o.ntee_code}` : undefined,
    url: `https://projects.propublica.org/nonprofits/organizations/${o.ein}`,
    tags: [o.subsection_code ? `501(c)(${o.subsection_code})` : "", o.city as string, o.state as string].filter(Boolean),
  }));
}

async function fetchGitHub(data: SearchData): Promise<LiveRecord[]> {
  const q = data.githubUsername
    ? `user:${data.githubUsername}`
    : [data.firstName, data.lastName, data.employer].filter(Boolean).join("+");
  if (!q) return [];
  const url = data.githubUsername
    ? `https://api.github.com/users/${enc(data.githubUsername)}`
    : `https://api.github.com/search/users?q=${enc([data.firstName, data.lastName].filter(Boolean).join("+"))}&per_page=10`;

  const res = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();

  if (data.githubUsername) {
    // Single user response
    return [{
      title: json.name || json.login || data.githubUsername,
      subtitle: json.company ? `@${json.company}` : json.bio || "",
      detail: [json.location, json.email].filter(Boolean).join(" · "),
      url: json.html_url,
      tags: [`${json.public_repos} repos`, `${json.followers} followers`],
    }];
  }
  const users = json.items || [];
  return users.slice(0, 10).map((u: Record<string, unknown>) => ({
    title: (u.login as string) || "",
    subtitle: `github.com/${u.login}`,
    url: u.html_url as string,
    tags: [u.type as string],
  }));
}

async function fetchBOP(data: SearchData): Promise<LiveRecord[]> {
  const name = [data.firstName, data.lastName].filter(Boolean).join(" ");
  if (!name) return [];
  // BOP has a search endpoint
  const url = `https://www.bop.gov/PublicInfo/execute/inmateloc?OUTPUT=HTML&ACTION=GET&NAMEFMT=FormatLast&INMTLST&fn=${enc(data.firstName || "")}&ln=${enc(data.lastName || "")}&type=EXT`;
  // BOP doesn't have a real JSON API, so just return a record pointing to it
  return [{
    title: `Search BOP: ${name}`,
    subtitle: "Federal Bureau of Prisons official inmate locator",
    detail: "Click to search the official U.S. Bureau of Prisons database",
    url: `https://www.bop.gov/inmateloc/?fn=${enc(data.firstName || "")}&ln=${enc(data.lastName || "")}`,
    tags: ["Federal", "Official Gov Database"],
  }];
}

async function fetchNSOPW(data: SearchData): Promise<LiveRecord[]> {
  const name = [data.firstName, data.lastName].filter(Boolean).join(" ");
  if (!name) return [];
  const params = new URLSearchParams();
  if (data.firstName) params.set("firstName", data.firstName);
  if (data.lastName) params.set("lastName", data.lastName);
  if (data.state) params.set("state", data.state);
  return [{
    title: `Search NSOPW: ${name}`,
    subtitle: "National Sex Offender Public Website — official U.S. Dept. of Justice",
    detail: "Click to search the official national registry",
    url: `https://www.nsopw.gov/Search/Results?${params.toString()}`,
    tags: ["Federal", "Dept. of Justice", "Official"],
  }];
}

async function fetchVoterRecordsGov(data: SearchData): Promise<LiveRecord[]> {
  const name = [data.firstName, data.lastName].filter(Boolean).join(" ");
  if (!data.state) return [];
  // State-by-state voter lookup direct links
  const stateLinks: Record<string, string> = {
    FL: `https://registration.elections.myflorida.com/CheckVoterStatus`,
    TX: `https://teamrv-mvp.sos.texas.gov/MVP/mvp.do`,
    CA: `https://voterstatus.sos.ca.gov/`,
    NY: `https://voterlookup.elections.ny.gov/`,
    GA: `https://mvp.sos.ga.gov/s/voter-registration-overview`,
    PA: `https://www.vote.pa.gov/Register-to-Vote/Pages/Voter-Registration-Status.aspx`,
    OH: `https://voterlookup.ohiosos.gov/voterlookup.aspx`,
    MI: `https://mvic.sos.state.mi.us/Voter/Index`,
    NC: `https://vt.ncsbe.gov/RegLkup/`,
    AZ: `https://my.arizona.vote/PortalList.aspx`,
    WA: `https://voter.votewa.gov/WhereToVote.aspx`,
    CO: `https://www.sos.state.co.us/voter/pages/pub/olvr/findVoterReg.xhtml`,
    NV: `https://www.nvsos.gov/votersearch/`,
    WI: `https://myvote.wi.gov/en-US/FindMyPollingPlace`,
    MN: `https://mnvoters.sos.state.mn.us/`,
    VA: `https://vote.elections.virginia.gov/VoterInformation`,
    IL: `https://www.elections.il.gov/ElectionInformation/VoterRegistrationLookUp.aspx`,
    NJ: `https://voter.njsvrs.com/PublicAccess/servlet/com.saber.publicaccess.control.PublicAccessNavigationServlet?USERPROCESS=PublicSearch`,
    MA: `https://www.sec.state.ma.us/VoterRegistrationSearch/MyVoterRegStatus.aspx`,
    IN: `https://indianavoters.in.gov/`,
  };
  const link = stateLinks[data.state] || `https://www.usa.gov/voter-registration-card`;
  return [{
    title: `${data.state} Official Voter Lookup${name ? `: ${name}` : ""}`,
    subtitle: `Direct link to ${data.state} Secretary of State official voter registration database`,
    detail: "Government primary source — no aggregator involved",
    url: link,
    tags: [data.state, "Official Gov", "Secretary of State"],
  }];
}

async function fetchPropertyRecords(data: SearchData): Promise<LiveRecord[]> {
  if (!data.state) return [];
  // Direct county assessor links — these are the ACTUAL primary source
  const records: LiveRecord[] = [];
  
  records.push({
    title: `${data.state} Property Assessor — Direct Government Search`,
    subtitle: "Click to find your county assessor portal (primary source data)",
    detail: "County assessors are the primary source for all property record data",
    url: `https://www.officialpropertyrecords.com/official/${data.state.toLowerCase()}-property-records`,
    tags: ["Primary Source", data.state, "County Assessor"],
  });

  if (data.propertyAddress) {
    records.push({
      title: `USPS Address Verification: ${data.propertyAddress}`,
      subtitle: "Official USPS address standardization and verification",
      url: `https://tools.usps.com/zip-code-lookup.htm?byaddress`,
      tags: ["USPS Official", "Address Verification"],
    });
  }

  // State-specific direct assessor links
  const stateAssessor: Record<string, { name: string; url: string }> = {
    FL: { name: "Florida Property Appraiser Direct Search", url: "https://floridarevenue.com/property/Pages/Taxpayers_Portals.aspx" },
    TX: { name: "Texas Appraisal District Search (TAAD)", url: "https://www.taad.org/find-your-local-appraisal-district/" },
    CA: { name: "California County Assessors Directory", url: "https://www.boe.ca.gov/proptaxes/assessors.htm" },
    NY: { name: "NY Real Property System", url: "https://www.tax.ny.gov/pit/property/learn/index.htm" },
    IL: { name: "Illinois Property Tax Portal", url: "https://www.myillinoistax.com/" },
    PA: { name: "PA Property Assessment Search", url: "https://www.revenue.pa.gov/TaxTypes/PropertyTax/Pages/default.aspx" },
    OH: { name: "Ohio County Auditor Finder", url: "https://www.auditor.state.oh.us/services/RealEstate/Search.aspx" },
    GA: { name: "Georgia County Tax Assessors", url: "https://dor.georgia.gov/local-government-services/find-your-county-or-city-tax-office" },
    NC: { name: "NC Property Tax Records", url: "https://www.ncdor.gov/taxes-forms/property-tax" },
    MI: { name: "Michigan Equalization Search", url: "https://www.michigan.gov/treasury/standard/0,4679,7-121-44402_44403---,00.html" },
  };

  if (data.state && stateAssessor[data.state]) {
    const s = stateAssessor[data.state];
    records.push({
      title: s.name,
      subtitle: "Official state/county government property records — primary source",
      url: s.url,
      tags: [data.state, "Official Gov", "Property Records"],
    });
  }

  return records;
}

async function fetchSocialSecurity(data: SearchData): Promise<LiveRecord[]> {
  const name = [data.firstName, data.lastName].filter(Boolean).join(" ");
  if (!name) return [];
  return [
    {
      title: `SSA Death Index: ${name}`,
      subtitle: "Social Security Administration — official death index verification",
      detail: "Free access via FamilySearch (partner of SSA)",
      url: `https://www.familysearch.org/search/record/results?q.givenName=${enc(data.firstName || "")}&q.surname=${enc(data.lastName || "")}&f.collectionId=1202535`,
      tags: ["SSA Official Data", "FamilySearch Partner", "Free"],
    },
    {
      title: `SSA My Social Security`,
      subtitle: "Verify SSN ownership via Social Security Administration directly",
      url: "https://www.ssa.gov/myaccount/",
      tags: ["SSA Official", "Identity Verification"],
    },
  ];
}

async function fetchCourtsByState(data: SearchData): Promise<LiveRecord[]> {
  if (!data.state) return [];
  const stateCourtLinks: Record<string, { name: string; url: string }> = {
    FL: { name: "Florida Courts eCASES Online Search", url: "https://myeclerk.myorangeclerk.com/" },
    TX: { name: "Texas eCourts Case Lookup", url: "https://search.txcourts.gov/" },
    CA: { name: "California Courts Case Access", url: "https://www.courts.ca.gov/casesearch.htm" },
    NY: { name: "NY Courts WebCivil Supreme", url: "https://iapps.courts.state.ny.us/webcivil/ecourtsMain" },
    IL: { name: "Illinois Court Case Finder", url: "https://courtfinder.illinoiscourts.gov/" },
    PA: { name: "Pennsylvania UJS Portal", url: "https://ujsportal.pacourts.us/CaseSearch" },
    OH: { name: "Ohio Supreme Court Case Search", url: "https://www.supremecourt.ohio.gov/clerk/ecms/#/search" },
    GA: { name: "Georgia Court eCASES", url: "https://efsp.georgiacourts.gov/efsp/home.page" },
    NC: { name: "NC Courts eFile", url: "https://www.nccourts.gov/services/courts-and-cases" },
    MI: { name: "Michigan Court JIMS Case Search", url: "https://courts.michigan.gov/case-search/Pages/default.aspx" },
    WA: { name: "Washington Courts Case Search", url: "https://www.courts.wa.gov/caselookup/" },
    CO: { name: "Colorado Courts eCourts", url: "https://www.courts.state.co.us/Courts/Case_Search.cfm" },
    AZ: { name: "Arizona Court Case Lookup", url: "https://apps.supremecourt.az.gov/publicaccess/" },
    NV: { name: "Nevada eCourts", url: "https://www.nevadajudiciary.us/index.php/e-courts" },
    MN: { name: "Minnesota Court Records Online", url: "https://mncourts.gov/Access-Case-Records/Online-Access.aspx" },
    VA: { name: "Virginia Courts Case Information", url: "https://www.courts.state.va.us/cgi-bin/OCIS.exe?statustype=A&case=0" },
    NJ: { name: "NJ Courts eCourts", url: "https://portal.njcourts.gov/webe4/EntryController" },
    MA: { name: "Massachusetts Court Search", url: "https://www.masscourts.org/" },
    IN: { name: "Indiana Court Public Portal", url: "https://public.courts.in.gov/mycase/" },
    TN: { name: "Tennessee Court System", url: "https://www.tncourts.gov/file-a-case/case-lookup" },
    MO: { name: "Missouri Courts Case.net", url: "https://www.courts.mo.gov/casenet/base/welcome.do" },
    WI: { name: "Wisconsin CCAP Court Access", url: "https://wcca.wicourts.gov/" },
    MD: { name: "Maryland Judiciary Case Search", url: "https://casesearch.courts.state.md.us/casesearch/" },
    KY: { name: "Kentucky Court of Justice eCourts", url: "https://kcoj.kycourts.net/kyecourts/" },
    OR: { name: "Oregon eCourt Case Info", url: "https://publicaccess.courts.oregon.gov/PublicAccessLogin/" },
    SC: { name: "South Carolina E-Filing", url: "https://www.sccourts.org/caseSearch/" },
    AL: { name: "Alabama Alacourt", url: "https://v2.alacourt.com/" },
    LA: { name: "Louisiana Court Records", url: "https://www.lasc.org/court_records" },
    IA: { name: "Iowa Electronic Document Management", url: "https://www.iowacourts.gov/iowa-courts/court-type-information/district-court/edms-electronic-document-management-system/" },
    AR: { name: "Arkansas Court Connect", url: "https://caseinfo.arcourts.gov/cconnect/PROD/public/ck_public_qry_main.cp_main_idx" },
    CT: { name: "Connecticut Judicial Branch", url: "https://www.jud.ct.gov/crdockets/" },
    MS: { name: "Mississippi Courts", url: "https://courts.ms.gov/" },
    KS: { name: "Kansas eCourts", url: "https://www.kscourts.org/Kansas-Courts/eCourts.aspx" },
    NM: { name: "New Mexico Courts eCOURTS", url: "https://caselookup.nmcourts.gov/" },
    NE: { name: "Nebraska Judicial Branch JUSTICE", url: "https://www.nebraska.gov/justiceportal/" },
    ID: { name: "Idaho Courts iCourt", url: "https://mycourts.idaho.gov/odysseyportal" },
    WV: { name: "West Virginia Courts", url: "https://www.courtswv.gov/public-resources/court-resources.html" },
    ME: { name: "Maine Judicial Branch", url: "https://www.courts.maine.gov/fees_forms/forms/index.shtml" },
    MT: { name: "Montana Courts", url: "https://courts.mt.gov/" },
    OK: { name: "Oklahoma Courts Network", url: "https://www.oscn.net/dockets/" },
    UT: { name: "Utah Courts xChange", url: "https://www.utcourts.gov/xchange/" },
    HI: { name: "Hawaii Courts eCourt Kokua", url: "https://ecourt.ehawaii.gov/" },
    RI: { name: "Rhode Island Judiciary", url: "https://www.courts.ri.gov/" },
    DE: { name: "Delaware Courts eFile", url: "https://efts.courts.delaware.gov/ecf/" },
    SD: { name: "South Dakota Unified Judicial System", url: "https://ujs.sd.gov/" },
    ND: { name: "North Dakota Courts", url: "https://www.ndcourts.gov/" },
    VT: { name: "Vermont Judiciary", url: "https://www.vermontjudiciary.org/" },
    WY: { name: "Wyoming Courts", url: "https://www.courts.state.wy.us/" },
    AK: { name: "Alaska Court System CourtView", url: "https://records.courts.alaska.gov/ssl/mbthin/coawl.htm" },
    DC: { name: "D.C. Courts Case Search", url: "https://www.dccourts.gov/services/cases-online" },
  };

  const records: LiveRecord[] = [];
  const name = [data.firstName, data.lastName].filter(Boolean).join(" ");

  if (stateCourtLinks[data.state]) {
    const s = stateCourtLinks[data.state];
    records.push({
      title: s.name,
      subtitle: `Official ${data.state} state court records — primary government source`,
      detail: name ? `Search for: ${name}` : "Search by name, case number, or party",
      url: s.url,
      tags: [data.state, "Official Court System", "Primary Source"],
    });
  }

  // Federal courts always available
  records.push({
    title: "CourtListener — Federal Court Records",
    subtitle: "Free API access to PACER federal court dockets and opinions",
    detail: name ? `Searching for: ${name}` : "Search federal dockets, opinions, and parties",
    url: `https://www.courtlistener.com/?q=${enc(name)}&type=r&order_by=score+desc`,
    tags: ["Federal Courts", "PACER Data", "Free API"],
  });

  return records;
}

export function useLiveSearch() {
  const [results, setResults] = useState<LiveResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [done, setDone] = useState(false);

  const runSearch = useCallback(async (data: SearchData) => {
    setSearching(true);
    setDone(false);

    const sources: Array<{
      id: string;
      source: string;
      category: string;
      icon: string;
      fetch: () => Promise<LiveRecord[]>;
      directUrl: (d: SearchData) => string;
    }> = [
      {
        id: "courtlistener_people",
        source: "CourtListener — Judges & Attorneys",
        category: "Court & Legal Records",
        icon: "⚖️",
        fetch: () => fetchCourtListener(data),
        directUrl: (d) => `https://www.courtlistener.com/?q=${encodeURIComponent([d.firstName, d.lastName].filter(Boolean).join(" "))}&type=people`,
      },
      {
        id: "courtlistener_dockets",
        source: "CourtListener — Case Dockets",
        category: "Court & Legal Records",
        icon: "📁",
        fetch: () => fetchCourtListenerDockets(data),
        directUrl: (d) => `https://www.courtlistener.com/?q=${encodeURIComponent([d.firstName, d.lastName].filter(Boolean).join(" "))}&type=r`,
      },
      {
        id: "fec",
        source: "FEC.gov — Political Donations",
        category: "Government Records",
        icon: "🏛️",
        fetch: () => fetchFEC(data),
        directUrl: (d) => {
          const p = new URLSearchParams();
          if (d.lastName) p.set("contributor_last_name", d.lastName);
          if (d.firstName) p.set("contributor_first_name", d.firstName);
          return `https://www.fec.gov/data/receipts/individual-contributions/?${p}`;
        },
      },
      {
        id: "opencorporates",
        source: "OpenCorporates — Corporate Officers",
        category: "Business & Employment",
        icon: "📊",
        fetch: () => fetchOpenCorporates(data),
        directUrl: (d) => `https://opencorporates.com/officers?q=${encodeURIComponent([d.firstName, d.lastName].filter(Boolean).join(" "))}&jurisdiction_code=us`,
      },
      {
        id: "propublica",
        source: "ProPublica — Nonprofit IRS Records",
        category: "Business & Employment",
        icon: "🏢",
        fetch: () => fetchProPublicaNonprofit(data),
        directUrl: (d) => `https://projects.propublica.org/nonprofits/search?q=${encodeURIComponent([d.firstName, d.lastName, d.employer].filter(Boolean).join(" "))}`,
      },
      {
        id: "github",
        source: "GitHub — Developer Profiles",
        category: "Social & Web",
        icon: "💻",
        fetch: () => fetchGitHub(data),
        directUrl: (d) => d.githubUsername ? `https://github.com/${d.githubUsername}` : `https://github.com/search?q=${encodeURIComponent([d.firstName, d.lastName].filter(Boolean).join("+"))}&type=users`,
      },
      {
        id: "bop",
        source: "Bureau of Prisons — Federal Inmates",
        category: "Court & Legal Records",
        icon: "🏢",
        fetch: () => fetchBOP(data),
        directUrl: () => "https://www.bop.gov/inmateloc/",
      },
      {
        id: "nsopw",
        source: "NSOPW — Sex Offender Registry",
        category: "Court & Legal Records",
        icon: "⚠️",
        fetch: () => fetchNSOPW(data),
        directUrl: (d) => {
          const p = new URLSearchParams();
          if (d.firstName) p.set("firstName", d.firstName);
          if (d.lastName) p.set("lastName", d.lastName);
          if (d.state) p.set("state", d.state);
          return `https://www.nsopw.gov/Search/Results?${p}`;
        },
      },
      {
        id: "voter",
        source: "Voter Registration — State Official",
        category: "Government Records",
        icon: "🗳️",
        fetch: () => fetchVoterRecordsGov(data),
        directUrl: () => "https://www.usa.gov/voter-registration-card",
      },
      {
        id: "property",
        source: "Property Records — County Assessor",
        category: "Property & Assets",
        icon: "🏠",
        fetch: () => fetchPropertyRecords(data),
        directUrl: () => "https://www.officialpropertyrecords.com/",
      },
      {
        id: "statecourt",
        source: "State Court Records",
        category: "Court & Legal Records",
        icon: "🏛️",
        fetch: () => fetchCourtsByState(data),
        directUrl: () => "https://www.courtlistener.com/",
      },
      {
        id: "ssa",
        source: "Social Security Administration",
        category: "Government Records",
        icon: "📋",
        fetch: () => fetchSocialSecurity(data),
        directUrl: () => "https://www.ssa.gov/myaccount/",
      },
    ];

    // Initialize all as loading
    setResults(
      sources.map((s) => ({
        source: s.source,
        category: s.category,
        icon: s.icon,
        status: "loading" as const,
        records: [],
        directUrl: s.directUrl(data),
      }))
    );

    // Run all in parallel, update each as they resolve
    await Promise.all(
      sources.map(async (s, i) => {
        try {
          const records = await s.fetch();
          setResults((prev) => {
            const next = [...prev];
            next[i] = {
              ...next[i],
              status: records.length > 0 ? "success" : "empty",
              records,
            };
            return next;
          });
        } catch (err) {
          console.log(`[${s.source}] error:`, err);
          setResults((prev) => {
            const next = [...prev];
            next[i] = {
              ...next[i],
              status: "error",
              records: [],
              error: err instanceof Error ? err.message : "Failed to fetch",
            };
            return next;
          });
        }
      })
    );

    setSearching(false);
    setDone(true);
  }, []);

  return { results, searching, done, runSearch };
}
