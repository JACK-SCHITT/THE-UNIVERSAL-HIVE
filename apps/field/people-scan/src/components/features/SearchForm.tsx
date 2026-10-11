import { useState } from "react";
import { ChevronRight, ChevronLeft, Search, SkipForward, User, MapPin, Phone, Globe, Users, Briefcase, Car, Scale, FileText } from "lucide-react";
import { SearchData } from "@/types";
import { US_STATES } from "@/constants/states";

interface Props {
  data: SearchData;
  onChange: (field: keyof SearchData, value: string) => void;
  onSubmit: () => void;
}

const STEPS = [
  { id: 0, label: "Identity", icon: User, color: "#00d4ff" },
  { id: 1, label: "Location", icon: MapPin, color: "#00d4ff" },
  { id: 2, label: "Contact", icon: Phone, color: "#00d4ff" },
  { id: 3, label: "Online", icon: Globe, color: "#00d4ff" },
  { id: 4, label: "Relationships", icon: Users, color: "#00d4ff" },
  { id: 5, label: "Professional", icon: Briefcase, color: "#00d4ff" },
  { id: 6, label: "Assets", icon: Car, color: "#00d4ff" },
  { id: 7, label: "Legal", icon: Scale, color: "#00d4ff" },
  { id: 8, label: "Notes", icon: FileText, color: "#00d4ff" },
];

interface FieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  half?: boolean;
}

const Field = ({ label, placeholder, value, onChange, type = "text", half }: FieldProps) => (
  <div className={half ? "w-full sm:w-[calc(50%-8px)]" : "w-full"}>
    <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">{label}</label>
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="input-dark w-full rounded-lg px-4 py-2.5 text-sm"
    />
  </div>
);

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  half?: boolean;
}

const SelectField = ({ label, value, onChange, options, half }: SelectFieldProps) => (
  <div className={half ? "w-full sm:w-[calc(50%-8px)]" : "w-full"}>
    <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="input-dark w-full rounded-lg px-4 py-2.5 text-sm appearance-none cursor-pointer"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-slate-900">
          {o.label}
        </option>
      ))}
    </select>
  </div>
);

export default function SearchForm({ data, onChange, onSubmit }: Props) {
  const [step, setStep] = useState(0);

  const o = (field: keyof SearchData) => (v: string) => onChange(field, v);
  const isLast = step === STEPS.length - 1;

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="flex flex-wrap gap-4">
            <Field label="First Name" placeholder="e.g. John" value={data.firstName} onChange={o("firstName")} half />
            <Field label="Middle Name" placeholder="e.g. Robert (optional)" value={data.middleName} onChange={o("middleName")} half />
            <Field label="Last Name" placeholder="e.g. Smith" value={data.lastName} onChange={o("lastName")} half />
            <SelectField label="Suffix" value={data.suffix} onChange={o("suffix")} half options={[
              { value: "", label: "None (optional)" },
              { value: "Jr", label: "Jr." },
              { value: "Sr", label: "Sr." },
              { value: "II", label: "II" },
              { value: "III", label: "III" },
              { value: "IV", label: "IV" },
            ]} />
            <Field label="Alias / Nickname / Maiden Name" placeholder="e.g. Johnny, Smith-Jones (optional)" value={data.alias} onChange={o("alias")} />
            <SelectField label="Gender" value={data.gender} onChange={o("gender")} options={[
              { value: "", label: "Unknown (optional)" },
              { value: "male", label: "Male" },
              { value: "female", label: "Female" },
              { value: "other", label: "Other" },
            ]} half />
            <Field label="Date of Birth" placeholder="MM/DD/YYYY (optional)" value={data.dateOfBirth} onChange={o("dateOfBirth")} type="date" half />
            <Field label="Age — From" placeholder="e.g. 35 (optional)" value={data.ageFrom} onChange={o("ageFrom")} type="number" half />
            <Field label="Age — To" placeholder="e.g. 45 (optional)" value={data.ageTo} onChange={o("ageTo")} type="number" half />
          </div>
        );
      case 1:
        return (
          <div className="flex flex-wrap gap-4">
            <Field label="Current City" placeholder="e.g. Chicago (optional)" value={data.city} onChange={o("city")} half />
            <SelectField label="Current State" value={data.state} onChange={o("state")} options={[{ value: "", label: "Any State (optional)" }, ...US_STATES]} half />
            <Field label="Zip Code" placeholder="e.g. 60601 (optional)" value={data.zipCode} onChange={o("zipCode")} half />
            <SelectField label="Country" value={data.country} onChange={o("country")} options={[
              { value: "United States", label: "United States" },
              { value: "Canada", label: "Canada" },
              { value: "United Kingdom", label: "United Kingdom" },
              { value: "Australia", label: "Australia" },
              { value: "Other", label: "Other" },
            ]} half />
            <div className="w-full border-t border-slate-700/50 pt-4">
              <p className="text-xs text-slate-500 mb-3 uppercase tracking-widest">Previous Location (optional)</p>
            </div>
            <Field label="Previous City" placeholder="e.g. Dallas (optional)" value={data.previousCity} onChange={o("previousCity")} half />
            <SelectField label="Previous State" value={data.previousState} onChange={o("previousState")} options={[{ value: "", label: "Any State (optional)" }, ...US_STATES]} half />
          </div>
        );
      case 2:
        return (
          <div className="flex flex-wrap gap-4">
            <Field label="Primary Phone Number" placeholder="e.g. (312) 555-0100 (optional)" value={data.phoneNumber} onChange={o("phoneNumber")} type="tel" half />
            <Field label="Alternate Phone" placeholder="e.g. (312) 555-0101 (optional)" value={data.alternatePhone} onChange={o("alternatePhone")} type="tel" half />
            <Field label="Primary Email Address" placeholder="e.g. john@example.com (optional)" value={data.email} onChange={o("email")} type="email" />
            <Field label="Alternate Email" placeholder="e.g. john.smith@work.com (optional)" value={data.alternateEmail} onChange={o("alternateEmail")} type="email" />
          </div>
        );
      case 3:
        return (
          <div className="flex flex-wrap gap-4">
            <Field label="General Username / Handle" placeholder="e.g. jsmith92 (optional)" value={data.username} onChange={o("username")} half />
            <Field label="Twitter / X Handle" placeholder="e.g. @johnsmith (optional)" value={data.twitterHandle} onChange={o("twitterHandle")} half />
            <Field label="Instagram Handle" placeholder="e.g. @john.smith (optional)" value={data.instagramHandle} onChange={o("instagramHandle")} half />
            <Field label="TikTok Handle" placeholder="e.g. @johnsmith (optional)" value={data.tiktokHandle} onChange={o("tiktokHandle")} half />
            <Field label="Snapchat Handle" placeholder="e.g. johnsmith99 (optional)" value={data.snapchatHandle} onChange={o("snapchatHandle")} half />
            <Field label="Reddit Username" placeholder="e.g. u/johnsmith (optional)" value={data.redditUsername} onChange={o("redditUsername")} half />
            <Field label="GitHub Username" placeholder="e.g. johnsmith (optional)" value={data.githubUsername} onChange={o("githubUsername")} half />
            <Field label="YouTube Channel" placeholder="e.g. @JohnSmithChannel (optional)" value={data.youtubeChannel} onChange={o("youtubeChannel")} half />
            <Field label="LinkedIn Profile URL" placeholder="e.g. linkedin.com/in/johnsmith (optional)" value={data.linkedinUrl} onChange={o("linkedinUrl")} />
            <Field label="Facebook Profile URL" placeholder="e.g. facebook.com/johnsmith (optional)" value={data.facebookUrl} onChange={o("facebookUrl")} />
            <Field label="Personal Website / Blog" placeholder="e.g. johnsmith.com (optional)" value={data.website} onChange={o("website")} />
          </div>
        );
      case 4:
        return (
          <div className="flex flex-wrap gap-4">
            <Field label="Known Relative Name(s)" placeholder="e.g. Mary Smith, Bob Smith (optional)" value={data.relativeName} onChange={o("relativeName")} />
            <Field label="Spouse / Partner Name" placeholder="e.g. Jane Smith (optional)" value={data.spouseName} onChange={o("spouseName")} />
            <Field label="Known Associate / Roommate" placeholder="e.g. Mike Johnson (optional)" value={data.associateName} onChange={o("associateName")} />
          </div>
        );
      case 5:
        return (
          <div className="flex flex-wrap gap-4">
            <Field label="Employer / Company Name" placeholder="e.g. Acme Corp (optional)" value={data.employer} onChange={o("employer")} half />
            <Field label="Job Title / Role" placeholder="e.g. Software Engineer (optional)" value={data.jobTitle} onChange={o("jobTitle")} half />
            <Field label="Industry" placeholder="e.g. Technology, Finance (optional)" value={data.industry} onChange={o("industry")} half />
            <Field label="School / University Attended" placeholder="e.g. University of Michigan (optional)" value={data.school} onChange={o("school")} half />
            <Field label="Graduation Year" placeholder="e.g. 2004 (optional)" value={data.graduationYear} onChange={o("graduationYear")} type="number" half />
          </div>
        );
      case 6:
        return (
          <div className="flex flex-wrap gap-4">
            <Field label="Vehicle Make" placeholder="e.g. Toyota (optional)" value={data.vehicleMake} onChange={o("vehicleMake")} half />
            <Field label="Vehicle Model" placeholder="e.g. Camry (optional)" value={data.vehicleModel} onChange={o("vehicleModel")} half />
            <Field label="Vehicle Year" placeholder="e.g. 2019 (optional)" value={data.vehicleYear} onChange={o("vehicleYear")} type="number" half />
            <Field label="License Plate Number" placeholder="e.g. ABC-1234 (optional)" value={data.licensePlate} onChange={o("licensePlate")} half />
            <SelectField label="License Plate State" value={data.licensePlateState} onChange={o("licensePlateState")} options={[{ value: "", label: "Any State (optional)" }, ...US_STATES]} half />
            <Field label="Known Property Address" placeholder="e.g. 123 Main St, Chicago, IL (optional)" value={data.propertyAddress} onChange={o("propertyAddress")} />
          </div>
        );
      case 7:
        return (
          <div className="flex flex-wrap gap-4">
            <SelectField label="Known Court / Legal Records?" value={data.hasCourtRecords} onChange={o("hasCourtRecords")} options={[
              { value: "", label: "Unknown (optional)" },
              { value: "yes", label: "Yes — known records exist" },
              { value: "no", label: "No — none known" },
              { value: "possibly", label: "Possibly" },
            ]} />
            <SelectField label="Criminal Record History?" value={data.hasCriminalRecord} onChange={o("hasCriminalRecord")} options={[
              { value: "", label: "Unknown (optional)" },
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
              { value: "possibly", label: "Possibly" },
            ]} />
            <SelectField label="Bankruptcy History?" value={data.bankruptcyHistory} onChange={o("bankruptcyHistory")} options={[
              { value: "", label: "Unknown (optional)" },
              { value: "yes", label: "Yes — filed bankruptcy" },
              { value: "no", label: "No" },
              { value: "possibly", label: "Possibly" },
            ]} />
          </div>
        );
      case 8:
        return (
          <div className="w-full">
            <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">Additional Notes / Context</label>
            <textarea
              placeholder="Any other details that might help narrow the search — past jobs, hobbies, neighborhoods, nicknames, known associates... (optional)"
              value={data.additionalNotes}
              onChange={(e) => onChange("additionalNotes", e.target.value)}
              rows={6}
              className="input-dark w-full rounded-lg px-4 py-3 text-sm resize-none"
            />
          </div>
        );
      default:
        return null;
    }
  };

  const completedSteps = STEPS.filter((s) => {
    if (s.id === 0) return data.firstName || data.lastName;
    if (s.id === 1) return data.city || data.state;
    if (s.id === 2) return data.phoneNumber || data.email;
    if (s.id === 3) return data.username || data.twitterHandle || data.instagramHandle;
    if (s.id === 4) return data.relativeName || data.spouseName;
    if (s.id === 5) return data.employer || data.school;
    if (s.id === 6) return data.vehicleMake || data.licensePlate || data.propertyAddress;
    if (s.id === 7) return data.hasCourtRecords || data.hasCriminalRecord;
    if (s.id === 8) return data.additionalNotes;
    return false;
  }).length;

  const progress = (completedSteps / STEPS.length) * 100;

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      {/* Progress header */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-700/40">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-slate-400 tracking-widest uppercase">Search Profile Builder</p>
          <span className="section-badge px-2.5 py-1 rounded-full">{completedSteps}/{STEPS.length} sections filled</span>
        </div>
        <div className="h-1 bg-slate-800 rounded-full overflow-hidden mb-4">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: "linear-gradient(90deg, #00d4ff, #0096ff)" }}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STEPS.map((s) => {
            const Icon = s.icon;
            const filled = completedSteps > s.id && [0,1,2,3,4,5,6,7,8].filter(i => {
              if (i === 0) return data.firstName || data.lastName;
              if (i === 1) return data.city || data.state;
              if (i === 2) return data.phoneNumber || data.email;
              if (i === 3) return data.username || data.twitterHandle;
              if (i === 4) return data.relativeName || data.spouseName;
              if (i === 5) return data.employer || data.school;
              if (i === 6) return data.vehicleMake || data.licensePlate;
              if (i === 7) return data.hasCourtRecords || data.hasCriminalRecord;
              if (i === 8) return data.additionalNotes;
              return false;
            }).includes(s.id);
            return (
              <button
                key={s.id}
                onClick={() => setStep(s.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  step === s.id
                    ? "text-[#00d4ff]"
                    : filled
                    ? "text-slate-300 hover:text-slate-100"
                    : "text-slate-600 hover:text-slate-400"
                }`}
                style={step === s.id ? { background: "rgba(0,212,255,0.12)", border: "1px solid rgba(0,212,255,0.3)" } : { background: "rgba(30,41,59,0.5)", border: "1px solid transparent" }}
              >
                <Icon size={11} />
                {s.label}
                {filled && <span className="w-1.5 h-1.5 rounded-full bg-[#00d4ff]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          {(() => {
            const Icon = STEPS[step].icon;
            return (
              <>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,212,255,0.12)", border: "1px solid rgba(0,212,255,0.25)" }}>
                  <Icon size={16} className="text-[#00d4ff]" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-100">{STEPS[step].label}</h3>
                  <p className="text-xs text-slate-500">All fields are optional — fill what you know</p>
                </div>
              </>
            );
          })()}
        </div>
        {renderStep()}
      </div>

      {/* Navigation */}
      <div className="px-6 pb-6 flex items-center justify-between gap-3">
        <div className="flex gap-2">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            style={{ background: "rgba(30,41,59,0.6)", border: "1px solid rgba(100,116,139,0.2)" }}
          >
            <ChevronLeft size={14} /> Back
          </button>
          <button
            onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
            disabled={isLast}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            style={{ background: "rgba(30,41,59,0.6)", border: "1px solid rgba(100,116,139,0.2)" }}
          >
            <SkipForward size={14} /> Skip
          </button>
        </div>
        {isLast ? (
          <button
            onClick={onSubmit}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all cyan-glow"
            style={{ background: "linear-gradient(135deg, #00d4ff, #0096ff)", color: "#0a0f1e" }}
          >
            <Search size={16} />
            Run Full Search
          </button>
        ) : (
          <button
            onClick={() => setStep((s) => s + 1)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-[#00d4ff] hover:text-white transition-all"
            style={{ background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.25)" }}
          >
            Next <ChevronRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
