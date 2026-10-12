// Educational descriptions. These models do not represent Affan's fabricated work.
const fetLegend=[
  {part:'substrate',label:'Silicon substrate',color:'#476aab',description:'The supporting silicon beneath the active device.'},
  {part:'isolation',label:'Isolation',color:'#526682',description:'Insulating regions separate the active silicon structures.'},
  {part:'channel',label:'Channel',color:'#4ad7e8',description:'The semiconductor path between source and drain, controlled by the gate.'},
  {part:'gate',label:'Gate',color:'#a078ed',description:'The gate conductor controls the channel through an insulating dielectric.'},
  {part:'oxide',label:'Gate dielectric',color:'#b2e0e5',description:'A thin insulator separates the gate conductor from the semiconductor channel.'},
  {part:'source-drain',label:'Source / drain',color:'#fa7865',description:'The two semiconductor terminal regions at opposite ends of the channel.'},
  {part:'contacts',label:'Contacts',color:'#edb46d',description:'Conductive contacts provide connections to the device terminals.'}
];
export const SILICON_MODELS={
  wafer:{
    title:'One wafer. Many dies.',kicker:'WAFER GEOMETRY',
    summary:'Compare real wafer diameters at the same visual scale. Change the example die size to see how many complete square sites fit on a centred grid.',
    tryThis:'Keep the die size fixed, then switch from 150 to 300 mm. The gross circular area becomes four times larger.',
    notes:'The outer reference ring always represents 300 mm. Diameter and die footprints use proportional dimensions. Thickness and surface colours are illustrative. The site count is a geometric teaching example, not a manufacturing yield prediction.',
    legend:[
      {part:'wafer',label:'Silicon wafer',color:'#a69aea',description:'A circular silicon substrate. The diameter selector changes its physical footprint relative to the 300 mm reference.'},
      {part:'die',label:'Die sites',color:'#69d5df',description:'Complete square sites on an ideal centred grid. Select a larger die to see the count fall.'},
      {part:'scribe',label:'Scribe lanes',color:'#e7b477',description:'The gaps between example die sites. This model assumes a 0.2 mm lane width.'},
      {part:'reference',label:'300 mm reference',color:'#819caf',description:'This fixed outer ring keeps diameter comparisons at a common scale.'}
    ],
    sources:[{label:'Okmetic · 150, 200 and 300 mm silicon wafers',url:'https://www.okmetic.com/silicon-wafers/'}]
  },
  finfet:{
    title:'FinFET: control on three sides.',kicker:'TRI-GATE TRANSISTOR',
    summary:'A raised silicon fin connects source and drain. In this tri-gate example, the gate covers the top and both sidewalls, with a dielectric separating it from the channel.',
    tryThis:'Compare one fin with three fins, then turn off the cutaway to inspect the shared gate.',
    notes:'A structural teaching model of a tri-gate FinFET. Fin count is illustrative; no process node, physical dimensions, current, or performance is implied. Cutaway and separation expose normally hidden surfaces.',
    legend:fetLegend,
    sources:[{label:'Intel · Tri-Gate transistor structure',url:'https://www.intc.com/news-events/press-releases/detail/655/intel-reinvents-transistors-using-new-3-d-structure'}]
  },
  gaafet:{
    title:'GAAFET: the gate surrounds the channel.',kicker:'STACKED NANOSHEET TRANSISTOR',
    summary:'Horizontal semiconductor sheets connect common source and drain regions. Gate material surrounds each sheet through a dielectric, including underneath the channel.',
    tryThis:'Select three nanosheets and use the cutaway or separation control to find the gate beneath each channel.',
    notes:'This is a nanosheet form of gate-all-around FET, not a specific foundry implementation. Sheet count, proportions, and colours are illustrative. The source and drain connect the sheets in parallel.',
    legend:fetLegend,
    sources:[{label:'Samsung · Gate-all-around and stacked nanosheets',url:'https://semiconductor.samsung.com/support/tools-resources/dictionary/gaa-transistors-a-next-generation-process-for-next-generation-semiconductors/'}]
  },
  sram:{
    title:'Six transistors. One stored bit.',kicker:'6T SRAM CIRCUIT',
    summary:'Two cross-coupled CMOS inverters hold complementary states. Two access transistors connect the storage nodes to the bitlines when the wordline is enabled.',
    tryThis:'Switch the example stored bit and follow Q and Q̅. Select the access transistors to find the wordline connection.',
    notes:'An annotated circuit model, not a physical cell layout or electrical simulation. SRAM retains its state while powered without periodic refresh; it is volatile.',
    legend:[
      {part:'pullup',label:'2 PMOS pull-ups',color:'#b68cec',description:'Each PMOS belongs to one inverter and connects its output towards VDD.'},
      {part:'pulldown',label:'2 NMOS pull-downs',color:'#5aa9dd',description:'Each NMOS belongs to one inverter and connects its output towards ground.'},
      {part:'access',label:'2 access NMOS',color:'#efb365',description:'The wordline controls the connection between the storage nodes and the two bitlines.'},
      {part:'node-q',label:'Storage Q',color:'#58e0cb',description:'One storage node; the other inverter feeds back to hold its state.'},
      {part:'node-qbar',label:'Storage Q̅',color:'#ee88bd',description:'The complementary storage node in a stable SRAM state.'},
      {part:'wordline',label:'Wordline',color:'#e3c66e',description:'A shared control for both access-transistor gates.'},
      {part:'bitline',label:'BL / BL̅',color:'#70c9e6',description:'The pair of lines used by peripheral circuits for cell access.'},
      {part:'supply',label:'VDD / ground',color:'#99acc5',description:'Supply rails keep the cross-coupled inverters powered.'}
    ],
    sources:[{label:'UC Davis · 6T SRAM and memory circuits (PDF)',url:'https://www.ece.ucdavis.edu/~bbaas/116/notes/Handout.memories.pdf'}]
  },
  dram:{
    title:'One transistor. One capacitor.',kicker:'1T1C DRAM CIRCUIT',
    summary:'A wordline-controlled access transistor connects the bitline to a storage capacitor. Charge leaks over time, so DRAM needs periodic refresh.',
    tryThis:'Change the example bit, then trace the path from the bitline through the access transistor to the storage node.',
    notes:'A circuit teaching model, not a fabricated DRAM cell or charge simulation. Actual capacitors use specialised 3D structures. Sense amplifiers and refresh circuitry are outside this single-cell view.',
    legend:[
      {part:'access',label:'Access transistor',color:'#edb56e',description:'Connects the bitline to the storage node when its gate is enabled.'},
      {part:'capacitor',label:'Storage capacitor',color:'#a389e7',description:'Stores charge on an insulated electrode.'},
      {part:'storage',label:'Storage node',color:'#5ce0c9',description:'Connects the access transistor to one capacitor electrode.'},
      {part:'wordline',label:'Wordline',color:'#e3c66e',description:'Controls the gate of the access transistor.'},
      {part:'bitline',label:'Bitline',color:'#70c9e6',description:'Connects the cell to read and write circuitry.'},
      {part:'plate',label:'Common plate',color:'#aabfd3',description:'The other capacitor electrode has a reference potential; it is separate from the storage node.'}
    ],
    sources:[{label:'UC Davis · DRAM cell and refresh (PDF)',url:'https://www.ece.ucdavis.edu/~bbaas/116/notes/Handout.memories.pdf'},{label:'Micron · DRAM components',url:'https://www.micron.com/products/memory/dram-components/ddr5-sdram'}]
  },
  hbm:{
    title:'Memory, stacked in three dimensions.',kicker:'HBM PACKAGE ARCHITECTURE',
    summary:'DRAM dies stack above a base die. Through-silicon vias and inter-die connections create vertical paths; an interposer links the memory stack to a neighbouring compute die.',
    tryThis:'Compare 4, 8 and 12 DRAM dies, then separate the stack to distinguish TSVs, microbumps, and the base die.',
    notes:'A generic HBM architecture with a base die and interposer. The stack count excludes the base die. Examples span HBM generations and do not specify a product, capacity, bandwidth, or exact package dimensions.',
    legend:[
      {part:'dram',label:'DRAM dies',color:'#8874d4',description:'The selected count refers only to these memory dies.'},
      {part:'base',label:'Base die',color:'#5497ab',description:'The interface/base die beneath the DRAM stack in this architecture.'},
      {part:'tsv',label:'Through-silicon vias',color:'#ebb071',description:'Vertical conductors pass through the silicon dies.'},
      {part:'bumps',label:'Microbumps',color:'#edcc82',description:'Small conductive connections join adjacent dies in this example.'},
      {part:'interposer',label:'Silicon interposer',color:'#4b8b9b',description:'Fine-pitch routing connects the HBM stack and adjacent compute die.'},
      {part:'compute',label:'Compute die',color:'#73b8cd',description:'An adjacent processor or accelerator, separate from the memory stack.'},
      {part:'substrate',label:'Package substrate',color:'#3f526b',description:'The package support and connection layer beneath the interposer.'}
    ],
    sources:[{label:'SK hynix · Base dies, TSVs and interposers',url:'https://news.skhynix.com/en/sk-hynix-partners-with-tsmc-to-strengthen-hbm-technological-leadership/'},{label:'Samsung · Four-die HBM and microbumps',url:'https://news.samsung.com/global/samsung-begins-mass-producing-worlds-fastest-dram-based-on-newest-high-bandwidth-memory-hbm-interface'},{label:'Micron · HBM3E 8-high and 12-high',url:'https://my.micron.com/products/memory/hbm/hbm3e'}]
  }
};
