import { FOREST, Note, PAPER, TornPhoto, condensed, roughMaskStyle, script, serif } from "./primitives";

type Member = {
  name: string;
  role: string;
  bio?: string;
  /** Portrait in /public/images/team, e.g. "/images/team/anand.webp". Without one, a paper-cut initials tile is shown. */
  image?: string;
  note?: string[];
  seed: number;
  tilt: number;
};

// TODO: add bios for Rahul and Hadeep.
const TEAM: Member[] = [
  {
    name: "Anand Lal S S",
    image: "/images/team/anand.webp",
    role: "Founder and CEO",
    bio: "Started the search for real, fresh nutrition and turned a curiosity about microgreens into a brand.",
    note: ["Where it", "all began."],
    seed: 61,
    tilt: -1.5,
  },
  {
    name: "Keerthi Krishnakumar Nair",
    image: "/images/team/keerthi.jpg",
    role: "Managing Director",
    bio: "Joined the vision early to bring fresh microgreens to modern city life.",
    seed: 73,
    tilt: 1.5,
  },
  {
    name: "Rahul",
    image: "/images/team/rahul.jpg",
    role: "CTO",
    seed: 85,
    tilt: -1,
  },
  {
    name: "Alfred",
    image: "/images/team/hadeep.jpg",
    role: "Chief Architect",
    seed: 97,
    tilt: 1.2,
  },
  {
    name: "Hadeep",
    image: "/images/team/alfred.jpg",
    role: "Tech Lead",
    seed: 109,
    tilt: -1.3,
  },
];

function initials(name: string) {
  return name
    .split(" ")
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function Portrait({ member }: { member: Member }) {
  if (member.image) {
    return (
      <TornPhoto
        src={member.image}
        alt={`Portrait of ${member.name}`}
        seed={member.seed}
        tilt={member.tilt}
        aspect="aspect-[4/5]"
        sizes="(min-width: 1024px) 26vw, (min-width: 640px) 44vw, 80vw"
      />
    );
  }
  return (
    <div className="relative drop-shadow-[0_12px_18px_rgba(34,44,24,0.22)]" style={{ transform: `rotate(${member.tilt}deg)` }}>
      <div
        className="relative flex aspect-[4/5] w-full items-center justify-center"
        style={{
          ...roughMaskStyle(member.seed),
          background: "linear-gradient(160deg, #cfdcbc 0%, #a9c08f 55%, #7fa46b 100%)",
        }}
      >
        <span className={`${serif.className} text-7xl font-semibold text-white/85`} style={condensed}>
          {initials(member.name)}
        </span>
      </div>
    </div>
  );
}

function MemberCard({ member }: { member: Member }) {
  return (
    <li className="relative w-full max-w-[19rem] sm:w-[calc(50%-1.5rem)] lg:w-[calc(20%-3.2rem)]">
      <div className="relative">
        <Portrait member={member} />
        {member.note && (
          <Note lines={member.note} desktopOnly className="-bottom-10 -right-6 -rotate-[9deg] text-[#29321f]" />
        )}
      </div>
      <div className="mt-6 text-center">
        <h3 className={`${serif.className} text-[1.7rem] font-semibold leading-tight`} style={{ ...condensed, color: FOREST }}>
          {member.name}
        </h3>
        <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#3f6b36]">{member.role}</p>
        {member.bio && (
          <p className="mx-auto mt-3 max-w-[16rem] text-[15px] leading-relaxed text-[#3a4135]">{member.bio}</p>
        )}
      </div>
    </li>
  );
}

export function TeamSection() {
  return (
    <section id="team" className="relative scroll-mt-24 overflow-hidden" style={{ backgroundColor: PAPER }}>
      <div className="relative mx-auto max-w-6xl px-6 pb-32 pt-10 md:px-10 lg:pt-16">
        <div className="relative text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#233021]">Chapter 3</p>
          <h2
            className={`${serif.className} mt-2 text-5xl font-bold leading-[0.95] lg:text-[4.5rem]`}
            style={{ ...condensed, color: FOREST }}
          >
            Our Team
          </h2>
          <p className="mt-4 text-xl text-[#1f2a1c] lg:text-2xl">The hands behind every tray.</p>
          <p className={`${script.className} mt-3 text-[1.35rem] text-[#3f6b36]`}>five people, one greener tomorrow</p>
        </div>

        <ul className="mt-16 flex flex-col items-center gap-x-12 gap-y-20 sm:flex-row sm:flex-wrap sm:items-start sm:justify-center lg:gap-x-16">
          {TEAM.map((m) => (
            <MemberCard key={m.name} member={m} />
          ))}
        </ul>
      </div>
    </section>
  );
}
