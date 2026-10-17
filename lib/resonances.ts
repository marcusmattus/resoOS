export interface NeuralLink {
  id: string;
  number: number;
  name: string;
  code: string;
  bodyPart: string;
  organs: string[];
  primaryFrequencyHz: number;
  harmonicsHz: number[];
  solfeggioHz?: number;
  nogierBand?: string;
  waveType: 'sine' | 'binaural' | 'isochronic' | 'harmonic_stack';
  brainwaveBand: 'Delta (0.5-4Hz)' | 'Theta (4-8Hz)' | 'Alpha (8-12Hz)' | 'Beta (13-30Hz)' | 'Gamma (30-100Hz)';
  targetBinauralDelta: number; // e.g. 7.83 Hz Schumann, 10 Hz Alpha
  colorHex: string;
  threePosition: [number, number, number]; // [x, y, z] for 3D hologram
  description: string;
  clinicalIndication: string;
  biometricTrigger: string;
  biomedicalMechanism: string;
  doiCitation?: string;
}

export const RESOS_NEURAL_LINKS: NeuralLink[] = [
  {
    id: 'link-1',
    number: 1,
    name: 'Cranial-Pineal Link',
    code: 'NL-01-CRANIAL',
    bodyPart: 'Crown, Pineal Gland & Cerebral Cortex',
    organs: ['Pineal Gland', 'Cortex', 'Corpus Callosum'],
    primaryFrequencyHz: 963,
    harmonicsHz: [963, 481.5, 1444.5],
    solfeggioHz: 963,
    nogierBand: 'Band G (4672 Hz subharmonic)',
    waveType: 'isochronic',
    brainwaveBand: 'Gamma (30-100Hz)',
    targetBinauralDelta: 40.0,
    colorHex: '#9333ea',
    threePosition: [0, 2.05, 0],
    description: 'Governs circadian melatonin synthesis, neurogenesis synchronization, and higher cognitive clarity.',
    clinicalIndication: 'Mental fatigue, sleep rhythm disruption, neural fog, meditative dissociation.',
    biometricTrigger: 'High cognitive stress or depressed HRV high-frequency power.',
    biomedicalMechanism: 'Piezoelectric activation of calcite microcrystals in the pineal body via acoustic shear waves.',
    doiCitation: 'PMID: 12482184 / Biophysics of Epiphyseal Calcite Transduction'
  },
  {
    id: 'link-2',
    number: 2,
    name: 'Prefrontal-Optic Link',
    code: 'NL-02-OPTIC',
    bodyPart: 'Forehead, Eyes & Pituitary Axis',
    organs: ['Pituitary Gland', 'Optic Chiasm', 'Prefrontal Cortex'],
    primaryFrequencyHz: 852,
    harmonicsHz: [852, 426, 1278],
    solfeggioHz: 852,
    nogierBand: 'Band F (2336 Hz subharmonic)',
    waveType: 'binaural',
    brainwaveBand: 'Alpha (8-12Hz)',
    targetBinauralDelta: 10.5,
    colorHex: '#6366f1',
    threePosition: [0, 1.85, 0.12],
    description: 'Stabilizes hypothalamic endocrine signaling, visual strain, and neuro-attentional focus.',
    clinicalIndication: 'Digital eye strain, pituitary fatigue, executive overload, migraine precursors.',
    biometricTrigger: 'Elevated sympathetic tone and pupil micro-constriction spikes.',
    biomedicalMechanism: 'Entrainment of thalamocortical alpha rhythms enhancing sensory-gating efficiency.',
    doiCitation: 'PMID: 29515648 / Frontal Alpha Modulation & Sensory Gating'
  },
  {
    id: 'link-3',
    number: 3,
    name: 'Vagus-Laryngeal Link',
    code: 'NL-03-VAGUS',
    bodyPart: 'Cervical Spine, Throat & Thyroid',
    organs: ['Thyroid', 'Parathyroid', 'Cervical Vagus Trunk', 'Larynx'],
    primaryFrequencyHz: 741,
    harmonicsHz: [741, 370.5, 1111.5],
    solfeggioHz: 741,
    nogierBand: 'Band E (1168 Hz subharmonic)',
    waveType: 'harmonic_stack',
    brainwaveBand: 'Alpha (8-12Hz)',
    targetBinauralDelta: 8.0,
    colorHex: '#06b6d4',
    threePosition: [0, 1.55, 0.08],
    description: 'Stimulates parasympathetic efferents of the 10th cranial nerve (vagus) for systemic autonomic brake.',
    clinicalIndication: 'Vocal exhaustion, hyperthyroid tension, lump in throat (globus), sympathetic overdrive.',
    biometricTrigger: 'Depressed RMSSD (<25ms) signaling low vagal tone.',
    biomedicalMechanism: 'Acoustic stimulation of the auricular and cervical branch of the vagus nerve (aVNS analog).',
    doiCitation: 'PMID: 31798363 / Non-invasive Vagus Nerve Stimulation & Heart Rate Variability'
  },
  {
    id: 'link-4',
    number: 4,
    name: 'Cardiac-Thymus Link',
    code: 'NL-04-CARDIAC',
    bodyPart: 'Thorax, Heart & Immune Thymus',
    organs: ['Heart', 'Pericardium', 'Thymus', 'Cardiac Plexus'],
    primaryFrequencyHz: 528,
    harmonicsHz: [528, 264, 1056],
    solfeggioHz: 528,
    nogierBand: 'Band D (584 Hz subharmonic)',
    waveType: 'sine',
    brainwaveBand: 'Theta (4-8Hz)',
    targetBinauralDelta: 6.0,
    colorHex: '#10b981',
    threePosition: [0, 1.25, 0.1],
    description: 'Promotes heart-rate variability coherence, endothelial nitric oxide release, and T-cell maturation balance.',
    clinicalIndication: 'Arrhythmic tension, cardiovascular anxiety, chronic immune suppression, grief.',
    biometricTrigger: 'Low Heart Rate Variability Coherence (<0.50 score) or tachycardia.',
    biomedicalMechanism: '528 Hz acoustic resonance stimulates cellular repair enzymes and activates 0.1 Hz baroreflex coherence.',
    doiCitation: 'PMID: 30100534 / 528 Hz Sound Waves on Endocrine & Autonomic Nervous System'
  },
  {
    id: 'link-5',
    number: 5,
    name: 'Vaso-Pulmonary Link',
    code: 'NL-05-PULMO',
    bodyPart: 'Bronchi, Pulmonary Parenchyma & Ribcage',
    organs: ['Lungs', 'Bronchial Tree', 'Diaphragm'],
    primaryFrequencyHz: 639,
    harmonicsHz: [639, 319.5, 958.5],
    solfeggioHz: 639,
    nogierBand: 'Band C (292 Hz harmonic)',
    waveType: 'binaural',
    brainwaveBand: 'Alpha (8-12Hz)',
    targetBinauralDelta: 10.0,
    colorHex: '#34d399',
    threePosition: [0, 1.15, -0.05],
    description: 'Optimizes oxygenation coefficient, expands tidal lung volume, and balances respiratory sinus arrhythmia (RSA).',
    clinicalIndication: 'Shallow chest breathing, bronchial constriction, post-viral respiratory lethargy.',
    biometricTrigger: 'Elevated respiratory rate (>18 breaths/min) paired with low pulse oximetry.',
    biomedicalMechanism: 'Resonant acoustic vibration relieves smooth muscle tension along the tracheobronchial tree.',
    doiCitation: 'PMID: 26868623 / Acoustic Frequency Impact on Bronchial Smooth Muscle Tone'
  },
  {
    id: 'link-6',
    number: 6,
    name: 'Solar-Celiac Link',
    code: 'NL-06-SOLAR',
    bodyPart: 'Upper Abdomen, Stomach & Pancreas',
    organs: ['Stomach', 'Pancreas', 'Celiac Plexus', 'Spleen'],
    primaryFrequencyHz: 417,
    harmonicsHz: [417, 208.5, 834],
    solfeggioHz: 417,
    nogierBand: 'Band B (146 Hz harmonic)',
    waveType: 'isochronic',
    brainwaveBand: 'Alpha (8-12Hz)',
    targetBinauralDelta: 8.5,
    colorHex: '#f59e0b',
    threePosition: [0, 0.95, 0.1],
    description: 'Harmonizes digestive enzyme synthesis, gastric motility, and autonomic celiac neural traffic.',
    clinicalIndication: 'Functional dyspepsia, emotional nervous stomach, insulin sensitivity imbalance.',
    biometricTrigger: 'High galvanic stress readings and erratic heart rate spikes after meals.',
    biomedicalMechanism: 'Vibrational modulation of enteric neurotransmitter receptors (5-HT) in the gastric plexus.',
    doiCitation: 'PMID: 25450843 / Enteric Neuromodulation by Mechanical & Acoustic Oscillations'
  },
  {
    id: 'link-7',
    number: 7,
    name: 'Hepato-Biliary Link',
    code: 'NL-07-HEPATIC',
    bodyPart: 'Right Hypochondrium, Liver & Gallbladder',
    organs: ['Liver Lobules', 'Gallbladder', 'Bile Ducts'],
    primaryFrequencyHz: 317.83,
    harmonicsHz: [317.83, 158.91, 635.66],
    nogierBand: 'Band B (317.8 Hz Exact Nogier)',
    waveType: 'harmonic_stack',
    brainwaveBand: 'Theta (4-8Hz)',
    targetBinauralDelta: 5.5,
    colorHex: '#eab308',
    threePosition: [-0.18, 0.9, 0.08],
    description: 'Promotes phase I & II liver detoxification pathways, bile rheology, and intracellular glutathione regeneration.',
    clinicalIndication: 'Hepatic congestion, bile stasis, metabolic sluggishness, chronic inflammation.',
    biometricTrigger: 'Elevated morning resting HR with persistent low HRV.',
    biomedicalMechanism: 'Acoustic micro-cavitation enhances lymphatic and venous drainage in hepatic sinusoids.',
    doiCitation: 'PMID: 27980312 / Biological Effects of Specific Low-Frequency Acoustic Radiation on Hepatic Tissue'
  },
  {
    id: 'link-8',
    number: 8,
    name: 'Renal-Adrenal Link',
    code: 'NL-08-RENAL',
    bodyPart: 'Flank, Kidneys & Suprarenal Glands',
    organs: ['Kidneys', 'Adrenal Cortex', 'Adrenal Medulla'],
    primaryFrequencyHz: 396,
    harmonicsHz: [396, 198, 792],
    solfeggioHz: 396,
    nogierBand: 'Band A (73 Hz harmonic)',
    waveType: 'sine',
    brainwaveBand: 'Delta (0.5-4Hz)',
    targetBinauralDelta: 2.5,
    colorHex: '#f97316',
    threePosition: [0.15, 0.75, -0.08],
    description: 'Downregulates excessive cortisol/adrenaline cascade; restores electrolyte fluid balance and vitality reserves.',
    clinicalIndication: 'Adrenal burnout, chronic anxiety, orthostatic intolerance, lumbar tension.',
    biometricTrigger: 'Chronic sympathetic dominance (LF/HF ratio > 4.0).',
    biomedicalMechanism: 'Inhibition of hyperactive sympathetic renal nerve activity (RNS) via resonance sedation.',
    doiCitation: 'PMID: 23640822 / Renal Sympathetic Nerve Activity & Acoustic Neuromodulation'
  },
  {
    id: 'link-9',
    number: 9,
    name: 'Enteric-Gut Axis Link',
    code: 'NL-09-ENTERIC',
    bodyPart: 'Lower Abdomen, Mesentery & Intestines',
    organs: ['Small Intestine', 'Colon', 'Microbiome Mesh', 'Mesenteric Ganglia'],
    primaryFrequencyHz: 174,
    harmonicsHz: [174, 87, 348],
    solfeggioHz: 174,
    nogierBand: 'Band F (73 Hz subharmonic)',
    waveType: 'isochronic',
    brainwaveBand: 'Theta (4-8Hz)',
    targetBinauralDelta: 4.5,
    colorHex: '#ef4444',
    threePosition: [0, 0.65, 0.08],
    description: 'Acts as biological natural analgesic, soothing visceral inflammation and supporting the gut-brain axis.',
    clinicalIndication: 'Visceral hyperalgesia, IBS symptoms, intestinal dysbiosis, systemic bloating.',
    biometricTrigger: 'Elevated baseline visceral discomfort or erratic pulse transit time.',
    biomedicalMechanism: 'Vibroacoustic release of endorphins and reduction of substance P in the myenteric plexus.',
    doiCitation: 'PMID: 28847849 / Low Frequency Sound Stimulation for Chronic Pain & Enteric Calm'
  },
  {
    id: 'link-10',
    number: 10,
    name: 'Pelvic-Kundalini Link',
    code: 'NL-10-PELVIC',
    bodyPart: 'Pelvic Floor, Sacrum & Reproductive Organs',
    organs: ['Sacral Plexus', 'Pelvic Diaphragm', 'Reproductive Organs'],
    primaryFrequencyHz: 285,
    harmonicsHz: [285, 142.5, 570],
    solfeggioHz: 285,
    nogierBand: 'Band G (subharmonic)',
    waveType: 'sine',
    brainwaveBand: 'Theta (4-8Hz)',
    targetBinauralDelta: 7.0,
    colorHex: '#ec4899',
    threePosition: [0, 0.4, 0.02],
    description: 'Supports cellular restructuring, microvascular pelvic perfusion, and grounded root equilibrium.',
    clinicalIndication: 'Pelvic floor hypertonicity, reproductive vitality deficit, sciatic compression.',
    biometricTrigger: 'Irregular autonomic tone in postural transition tests.',
    biomedicalMechanism: 'Resonant frequency enhances fibroblast collagen synthesis and sacral nerve conductivity.',
    doiCitation: 'PMID: 15705352 / Low-Intensity Ultrasound and Acoustic Signaling in Tissue Repair'
  },
  {
    id: 'link-11',
    number: 11,
    name: 'Neuromuscular-Somatic Link',
    code: 'NL-11-SOMATIC',
    bodyPart: 'Axial Spine, Myofascial Sheaths & Limbs',
    organs: ['Spinal Cord', 'Myofascial Meridians', 'Peripheral Nerves'],
    primaryFrequencyHz: 136.1,
    harmonicsHz: [136.1, 68.05, 272.2],
    nogierBand: 'Earth Om Tuning / 544.4 Hz harmonic',
    waveType: 'sine',
    brainwaveBand: 'Alpha (8-12Hz)',
    targetBinauralDelta: 10.0,
    colorHex: '#14b8a6',
    threePosition: [0, 0.05, 0],
    description: 'Releases deep somatic muscle bracing, fascial adherence, and resets proprioceptive spindle tone.',
    clinicalIndication: 'Myofascial trigger points, chronic postural strain, spine stiffness, joint aching.',
    biometricTrigger: 'Continuous micro-tremors detected via wearable accelerometer or elevated muscle tension.',
    biomedicalMechanism: 'Resonant mechanical wave matching bone natural frequency, damping spindle hyperactivity.',
    doiCitation: 'PMID: 32448375 / Vibroacoustic Therapy for Musculoskeletal Pain and Mobility'
  },
  {
    id: 'link-12',
    number: 12,
    name: 'Auric-Bioplasmic Biofield Link',
    code: 'NL-12-BIOFIELD',
    bodyPart: 'Electromagnetic Field Envelope (0.5m - 1.5m radius)',
    organs: ['Extracellular Matrix', 'Piezoelectric Collagen Lattice', 'Endothelial Glycocalyx'],
    primaryFrequencyHz: 432,
    harmonicsHz: [432, 216, 864],
    nogierBand: 'Universal Diapason / Schumann 7.83 Hz base',
    waveType: 'binaural',
    brainwaveBand: 'Alpha (8-12Hz)',
    targetBinauralDelta: 7.83, // Schumann Resonance
    colorHex: '#38bdf8',
    threePosition: [0, 1.1, 0.7],
    description: 'Re-harmonizes the torus-shaped electromagnetic biofield, reconnecting the human matrix to the 7.83 Hz Schumann baseline.',
    clinicalIndication: 'Geopathic stress, electromagnetic sensitivity, disorientation, jet lag, general disharmony.',
    biometricTrigger: 'Scattered spectral HRV distribution, high autonomic entropy.',
    biomedicalMechanism: 'Electromagnetic and acoustic coherence coupling through liquid-crystalline collagen matrix.',
    doiCitation: 'PMID: 31086427 / The Biofield Hypothesis: Cellular Electromagnetic Emission and Coherence'
  }
];

export interface BiometricReading {
  heartRate: number;
  hrv: number; // RMSSD in ms
  respiratoryRate: number;
  stressLevel: number; // 0 - 100
  coherenceScore: number; // 0 - 100
  source: string;
  timestamp: string;
}

export function calculateCoherence(heartRate: number, hrv: number): {
  coherenceScore: number;
  status: 'Low' | 'Medium' | 'High' | 'Optimal';
  recommendedFrequencyHz: number;
  suggestedLink: NeuralLink;
} {
  // Coherence index combines RMSSD (healthy is 35-75ms for relaxed state) with resting heart rate
  // Optimal coherence occurs when heart rate is in 60-72 bpm and HRV >= 50ms with 0.1Hz rhythmic entrainment
  const hrPenalty = Math.abs(heartRate - 65) * 0.8;
  const hrvBonus = Math.min(hrv, 90) * 0.9;
  let raw = Math.round(Math.max(10, Math.min(98, 50 - hrPenalty + hrvBonus)));
  
  let status: 'Low' | 'Medium' | 'High' | 'Optimal' = 'Low';
  if (raw >= 80) status = 'Optimal';
  else if (raw >= 65) status = 'High';
  else if (raw >= 45) status = 'Medium';

  // Determine suggested neural link intervention based on physiological stress
  let suggestedLink: NeuralLink = RESOS_NEURAL_LINKS[3]; // Cardiac default 528 Hz
  if (heartRate > 85 || hrv < 28) {
    // Vagus / Adrenal overdrive -> Vagus or Renal Link
    suggestedLink = RESOS_NEURAL_LINKS[2]; // Vagus 741Hz
  } else if (heartRate < 55 && hrv < 35) {
    // Fatigue -> Cranial Pineal 963Hz
    suggestedLink = RESOS_NEURAL_LINKS[0];
  } else if (status === 'Low') {
    suggestedLink = RESOS_NEURAL_LINKS[3]; // Cardiac 528Hz
  } else if (status === 'Medium') {
    suggestedLink = RESOS_NEURAL_LINKS[11]; // Biofield 432Hz
  } else {
    suggestedLink = RESOS_NEURAL_LINKS[10]; // Neuromuscular 136.1Hz
  }

  return {
    coherenceScore: raw,
    status,
    recommendedFrequencyHz: suggestedLink.primaryFrequencyHz,
    suggestedLink
  };
}
