import SignalMarker from "@/components/SignalMarker";
import PulseText from "@/components/PulseText";

function MotifAnalytics() {
  return (
    <svg
      className="work-card__motif"
      viewBox="0 0 300 116"
      role="img"
      aria-label="Analytics dashboard"
    >
      <g stroke="#2B2F2D" strokeWidth="1">
        <line x1="28" y1="96" x2="282" y2="96" />
        <line x1="28" y1="70" x2="282" y2="70" />
        <line x1="28" y1="44" x2="282" y2="44" />
      </g>
      <g>
        <rect
          x="64"
          y="60"
          width="24"
          height="36"
          rx="3"
          fill="#8C918F"
          opacity=".5"
        />
        <rect
          x="106"
          y="42"
          width="24"
          height="54"
          rx="3"
          fill="#8C918F"
          opacity=".62"
        />
        <rect
          x="148"
          y="52"
          width="24"
          height="44"
          rx="3"
          fill="#8C918F"
          opacity=".54"
        />
        <rect
          x="190"
          y="26"
          width="24"
          height="70"
          rx="3"
          fill="#6E7573"
          opacity=".8"
        />
        <rect x="232" y="14" width="24" height="82" rx="3" fill="#A5AAA7" />
      </g>
      <polyline
        points="76,54 118,38 160,46 202,22 244,12"
        fill="none"
        stroke="#F25F57"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <g fill="#101312" stroke="#F25F57" strokeWidth="1.5">
        <circle cx="76" cy="54" r="2.6" />
        <circle cx="118" cy="38" r="2.6" />
        <circle cx="160" cy="46" r="2.6" />
        <circle cx="202" cy="22" r="2.6" />
        <circle cx="244" cy="12" r="2.6" />
      </g>
    </svg>
  );
}

function MotifLogistics() {
  return (
    <svg
      className="work-card__motif"
      viewBox="0 0 300 116"
      role="img"
      aria-label="Logistics route"
    >
      <g fill="#2B2F2D">
        <circle cx="50" cy="30" r="1.3" />
        <circle cx="90" cy="30" r="1.3" />
        <circle cx="130" cy="30" r="1.3" />
        <circle cx="170" cy="30" r="1.3" />
        <circle cx="210" cy="30" r="1.3" />
        <circle cx="250" cy="30" r="1.3" />
        <circle cx="50" cy="60" r="1.3" />
        <circle cx="90" cy="60" r="1.3" />
        <circle cx="130" cy="60" r="1.3" />
        <circle cx="170" cy="60" r="1.3" />
        <circle cx="210" cy="60" r="1.3" />
        <circle cx="250" cy="60" r="1.3" />
        <circle cx="50" cy="90" r="1.3" />
        <circle cx="90" cy="90" r="1.3" />
        <circle cx="130" cy="90" r="1.3" />
        <circle cx="170" cy="90" r="1.3" />
        <circle cx="210" cy="90" r="1.3" />
        <circle cx="250" cy="90" r="1.3" />
      </g>
      <path
        d="M48,90 C78,84 82,46 108,46 C136,46 144,76 164,76"
        fill="none"
        stroke="#8C918F"
        strokeWidth="2.2"
        strokeDasharray="6 6"
        strokeLinecap="round"
      />
      <path
        d="M164,76 C196,76 206,36 230,32"
        fill="none"
        stroke="#F25F57"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <g fill="#101312" stroke="#8C918F" strokeWidth="2">
        <circle cx="48" cy="90" r="5" />
        <circle cx="108" cy="46" r="5" />
        <circle cx="164" cy="76" r="5" />
      </g>
      <circle cx="230" cy="32" r="6.5" fill="#F25F57" />
      <circle
        cx="230"
        cy="32"
        r="11"
        fill="none"
        stroke="#F25F57"
        strokeWidth="1.2"
        opacity=".5"
      />
    </svg>
  );
}

function MotifERP() {
  return (
    <svg
      className="work-card__motif"
      viewBox="0 0 300 116"
      role="img"
      aria-label="ERP stages: manufacturing, billing, shipping"
    >
      <defs>
        <marker
          id="erpArrow"
          viewBox="0 0 10 10"
          refX="7"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path
            d="M2 2L7 5L2 8"
            fill="none"
            stroke="#F25F57"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </marker>
      </defs>
      <g transform="translate(0,-10)">
        <rect
          x="40"
          y="52"
          width="56"
          height="32"
          rx="7"
          fill="#1C201E"
          stroke="#8C918F"
          strokeWidth="1.4"
        />
        <rect
          x="122"
          y="52"
          width="56"
          height="32"
          rx="7"
          fill="#1C201E"
          stroke="#F25F57"
          strokeWidth="1.6"
        />
        <rect
          x="204"
          y="52"
          width="56"
          height="32"
          rx="7"
          fill="#1C201E"
          stroke="#8C918F"
          strokeWidth="1.4"
        />
        <line
          x1="98"
          y1="68"
          x2="120"
          y2="68"
          stroke="#F25F57"
          strokeWidth="1.6"
          markerEnd="url(#erpArrow)"
        />
        <line
          x1="180"
          y1="68"
          x2="202"
          y2="68"
          stroke="#F25F57"
          strokeWidth="1.6"
          markerEnd="url(#erpArrow)"
        />

        {/* Manufacturing — cog */}
        <g stroke="#8C918F" strokeWidth="1.4" fill="none">
          <circle cx="68" cy="68" r="6" />
          <circle cx="68" cy="68" r="2.3" />
          <g strokeLinecap="round">
            <line x1="68" y1="59" x2="68" y2="62" />
            <line x1="68" y1="74" x2="68" y2="77" />
            <line x1="59" y1="68" x2="62" y2="68" />
            <line x1="74" y1="68" x2="77" y2="68" />
            <line x1="61.64" y1="61.64" x2="63.76" y2="63.76" />
            <line x1="72.24" y1="72.24" x2="74.36" y2="74.36" />
            <line x1="61.64" y1="74.36" x2="63.76" y2="72.24" />
            <line x1="72.24" y1="63.76" x2="74.36" y2="61.64" />
          </g>
        </g>

        {/* Billing — receipt */}
        <g stroke="#F25F57" fill="none" strokeLinejoin="round">
          <path
            d="M142,57 H158 V77 l-2,2.5 l-2,-2.5 l-2,2.5 l-2,-2.5 l-2,2.5 l-2,-2.5 l-2,2.5 l-2,-2.5 Z"
            strokeWidth="1.4"
          />
          <g strokeWidth="1.2" strokeLinecap="round">
            <line x1="146" y1="62" x2="154" y2="62" />
            <line x1="146" y1="66" x2="154" y2="66" />
            <line x1="146" y1="70" x2="151" y2="70" />
          </g>
        </g>

        {/* Shipping — truck */}
        <g
          stroke="#8C918F"
          strokeWidth="1.4"
          fill="none"
          strokeLinejoin="round"
        >
          <rect x="218" y="60" width="15" height="12" rx="1.5" />
          <path d="M233,63 H242 L246,67 V72 H233 Z" />
          <circle cx="224" cy="73" r="2.2" fill="#1C201E" />
          <circle cx="240" cy="73" r="2.2" fill="#1C201E" />
        </g>
      </g>
    </svg>
  );
}

function MotifDetection() {
  return (
    <svg
      className="work-card__motif"
      viewBox="0 0 300 116"
      role="img"
      aria-label="Label detection"
    >
      <g stroke="#2B2F2D" strokeWidth="1">
        <line x1="80" y1="16" x2="80" y2="100" />
        <line x1="140" y1="16" x2="140" y2="100" />
        <line x1="200" y1="16" x2="200" y2="100" />
        <line x1="28" y1="44" x2="282" y2="44" />
        <line x1="28" y1="72" x2="282" y2="72" />
      </g>
      <circle
        cx="118"
        cy="58"
        r="19"
        fill="#8C918F"
        opacity=".22"
        stroke="#8C918F"
        strokeWidth="1.2"
      />
      <rect
        x="186"
        y="52"
        width="48"
        height="38"
        rx="7"
        fill="#6E7573"
        opacity=".2"
        stroke="#6E7573"
        strokeWidth="1.2"
      />
      <g stroke="#F25F57" strokeWidth="2" fill="none" strokeLinecap="round">
        <path d="M92,41 V32 H101" />
        <path d="M135,32 H144 V41" />
        <path d="M92,75 V84 H101" />
        <path d="M135,84 H144 V75" />
      </g>
      <g stroke="#8C918F" strokeWidth="1.8" fill="none" strokeLinecap="round">
        <path d="M178,52 V44 H186" />
        <path d="M234,44 H242 V52" />
        <path d="M178,90 V98 H186" />
        <path d="M234,98 H242 V90" />
      </g>
    </svg>
  );
}

function MotifScan3D() {
  return (
    <svg
      className="work-card__motif"
      viewBox="0 0 300 116"
      role="img"
      aria-label="Structured-light 3D scan"
    >
      <g transform="translate(0,-4)">
        <g stroke="#6E7573" strokeWidth="1" opacity=".55">
          <line x1="108" y1="50" x2="192" y2="50" />
          <line x1="104" y1="74" x2="196" y2="74" />
        </g>
        <g stroke="#8C918F" strokeWidth="1.4" strokeLinecap="round">
          <line x1="150" y1="24" x2="104" y2="58" />
          <line x1="150" y1="24" x2="196" y2="58" />
          <line x1="150" y1="24" x2="168" y2="82" />
          <line x1="150" y1="100" x2="104" y2="58" />
          <line x1="150" y1="100" x2="196" y2="58" />
          <line x1="150" y1="100" x2="168" y2="82" />
          <line x1="104" y1="58" x2="168" y2="82" />
          <line x1="168" y1="82" x2="196" y2="58" />
        </g>
        <g stroke="#8C918F" strokeWidth="1" strokeLinecap="round" opacity=".4">
          <line x1="150" y1="24" x2="132" y2="42" />
          <line x1="150" y1="100" x2="132" y2="42" />
          <line x1="196" y1="58" x2="132" y2="42" />
          <line x1="132" y1="42" x2="104" y2="58" />
        </g>
        <g fill="#A5AAA7">
          <circle cx="150" cy="100" r="2.6" />
          <circle cx="104" cy="58" r="2.6" />
          <circle cx="196" cy="58" r="2.6" />
          <circle cx="168" cy="82" r="2.6" />
          <circle cx="132" cy="42" r="2.2" opacity=".6" />
        </g>
        {/* Apex — the one point that carries the signal. */}
        <circle cx="150" cy="24" r="3.2" fill="#F25F57" />
        <g fill="#6E7573" opacity=".7">
          <circle cx="124" cy="70" r="1.3" />
          <circle cx="178" cy="50" r="1.3" />
          <circle cx="150" cy="88" r="1.3" />
          <circle cx="140" cy="60" r="1.3" />
          <circle cx="162" cy="66" r="1.3" />
        </g>
      </g>
    </svg>
  );
}

function MotifCloud() {
  return (
    <svg
      className="work-card__motif"
      viewBox="0 0 300 116"
      role="img"
      aria-label="Cloud control plane"
    >
      <g stroke="#8C918F" strokeWidth="1.3" opacity=".7" strokeLinecap="round">
        <line x1="150" y1="58" x2="150" y2="22" />
        <line x1="150" y1="58" x2="212" y2="94" />
        <line x1="150" y1="58" x2="88" y2="94" />
        <line x1="150" y1="58" x2="60" y2="42" />
      </g>
      <line
        x1="150"
        y1="58"
        x2="240"
        y2="42"
        stroke="#F25F57"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <rect
        x="143"
        y="15"
        width="14"
        height="14"
        rx="3"
        fill="#101312"
        stroke="#8C918F"
        strokeWidth="1.4"
      />
      <circle
        cx="240"
        cy="42"
        r="7"
        fill="#101312"
        stroke="#8C918F"
        strokeWidth="1.4"
      />
      <rect
        x="205"
        y="87"
        width="14"
        height="14"
        rx="3"
        fill="#101312"
        stroke="#8C918F"
        strokeWidth="1.4"
      />
      <circle
        cx="88"
        cy="94"
        r="7"
        fill="#101312"
        stroke="#8C918F"
        strokeWidth="1.4"
      />
      <circle
        cx="60"
        cy="42"
        r="7"
        fill="#101312"
        stroke="#8C918F"
        strokeWidth="1.4"
      />
      <rect
        x="138"
        y="46"
        width="24"
        height="24"
        rx="6"
        fill="#1C201E"
        stroke="#F25F57"
        strokeWidth="1.8"
      />
      <circle cx="150" cy="58" r="3" fill="#F25F57" />
    </svg>
  );
}

const projects = [
  {
    key: "analytics",
    title: "Analytics · Insights",
    chip: "Live dashboards",
    desc: "A B2B analytics platform that turns workforce data into early employee mental-health signals, enabling proactive care.",
    Motif: MotifAnalytics,
  },
  {
    key: "logistics",
    title: "Logistics · Estimation",
    chip: "Cost modeling",
    desc: "An enterprise solution that routes material demand into transport schedules, forecasting cost and storage across each leg.",
    Motif: MotifLogistics,
  },
  {
    key: "erp",
    title: "Operations · ERP",
    chip: "Unified ERP",
    desc: "A single ERP running an entire operation, including manufacturing and inventory, shipping, staff access, and BoM and schematic version control.",
    Motif: MotifERP,
  },
  {
    key: "vision-detection",
    title: "Vision · Detection",
    chip: "Label detection",
    desc: "A neural network that locates a label at any position or rotation, then extracts its data into key-value pairs.",
    Motif: MotifDetection,
  },
  {
    key: "vision-3d",
    title: "Vision · 3D Capture",
    chip: "Structured light",
    desc: "A structured-light pipeline that turns coded projections into a dense point cloud, then a finished 3D model.",
    Motif: MotifScan3D,
  },
  {
    key: "cloud",
    title: "Cloud · Control Plane",
    chip: "Multi-cloud",
    desc: "A centralized controller that deploys app services across any cloud or container, with load balancing, WAF security, and auto-scaling.",
    Motif: MotifCloud,
  },
];

export default function Portfolio() {
  return (
    <section className="work section" id="work">
      <div className="container">
        <SignalMarker label="Selected work" className="marker--section" />

        <PulseText>
          <div className="work-grid">
            {projects.map((p) => {
              const Motif = p.Motif;
              return (
                <article key={p.key} className="work-card">
                  <div className="work-card__media">
                    <Motif />
                    <span className="work-card__chip">{p.chip}</span>
                  </div>
                  <div className="work-card__body-wrap">
                    <h3 className="work-card__title">{p.title}</h3>
                    <p className="work-card__desc">{p.desc}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </PulseText>
      </div>
    </section>
  );
}
