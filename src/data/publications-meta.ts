// Student Critical Essay Series — 6-volume book series
// Source: https://www.amazon.com/dp/B0DG6NNB2Y
// Updated April 2026

export interface SeriesBook {
  title: string;
  subtitle?: string;
  authors: string;
  publishedDate: string;
  description: string;
  amazonUrl: string;
  accent?: 'emerald' | 'amber' | 'sky' | 'rose' | 'indigo' | 'violet';
}

export interface BookSeries {
  name: string;
  description: string;
  amazonUrl: string;
  books: SeriesBook[];
}

const SERIES_URL = 'https://www.amazon.com/dp/B0DG6NNB2Y?binding=hardcover&ref=dbs_dp_rwt_sb_pc_thcv';

export const studentCriticalEssaySeries: BookSeries = {
  name: 'Student Critical Essay Series',
  description:
    'A collection showcasing the voices of young thinkers addressing crucial global issues through the lens of the UN Sustainable Development Goals. Each volume brings together essays from talented students across institutions, offering fresh perspectives on regional and thematic challenges — bridging academic thought and real-world action in the pursuit of a more sustainable and equitable future.',
  amazonUrl: SERIES_URL,
  books: [
    {
      title: 'Climate Crossroads',
      subtitle: 'Sustainability in the Global South',
      authors: 'Shijie Wang · Oliver Sinclair',
      publishedDate: 'September 4, 2024',
      description:
        'The first volume in the series. Essays from student leaders examining the integrated relationship between climate change and sustainable development through the lens of the Global South — environmental resources, food systems, gender justice in climate policy, and indigenous knowledge systems in developing nations.',
      amazonUrl: 'https://a.co/d/0ah3Q9gO',
      accent: 'emerald',
    },
    {
      title: 'Code and Culture',
      subtitle: 'Artificial Intelligence and Social Change in China',
      authors: 'Shijie Wang · Oliver Sinclair',
      publishedDate: 'September 9, 2024',
      description:
        'Student essays on the effects and ethical implications of AI in China — education, healthcare, environmental protection, governance, and cultural preservation. Examines the tension between innovation and concerns around privacy, surveillance, algorithmic discrimination, and the rural-urban divide.',
      amazonUrl: 'https://a.co/d/00fWgy9L',
      accent: 'sky',
    },
    {
      title: 'Chinese Mosaic',
      subtitle: 'Language, Gender, and Digital Culture in an Evolving Urban Landscape',
      authors: 'Oliver Sinclair and others',
      publishedDate: 'November 21, 2024',
      description:
        'Analyses of the intersections of language, gender, and digital culture in contemporary China. Covers multilingual signage in Suzhou, femvertising in cosmetic marketing, socioeconomic effects on children\'s language development, internet addiction, and how Chinese journalists adapt to social media.',
      amazonUrl: 'https://a.co/d/0f8xEiKn',
      accent: 'rose',
    },
    {
      title: "The Dragon's DNA",
      subtitle: "Ethics and Innovation in China's Biotechnology Revolution",
      authors: 'Yi Jin and others',
      publishedDate: 'December 25, 2024',
      description:
        "Essays on the ethics and innovation of China's biotechnology revolution — balancing agricultural productivity with environmental stewardship, the CRISPR babies controversy, GMO food safety, traditional Chinese medicine, and equitable access to genetic technologies.",
      amazonUrl: 'https://a.co/d/08eblXiu',
      accent: 'amber',
    },
    {
      title: 'Echoes of Empire',
      subtitle: 'Digital English Education in a Postcolonial Context',
      authors: 'Oliver Sinclair · Shijie Wang (Editor)',
      publishedDate: 'February 24, 2025',
      description:
        'Critical essays interrogating how digital technology — language-learning apps, content moderation, AI systems, educational platforms — reproduces and amplifies colonial power structures, often privileging Western epistemologies while marginalizing indigenous and non-Western ways of knowing.',
      amazonUrl: 'https://a.co/d/0brFjX70',
      accent: 'indigo',
    },
    {
      title: 'Digital Symbiosis',
      subtitle: 'Co-Evolving AI and Humanity in an Age of Sustainability',
      authors: 'Oliver Sinclair',
      publishedDate: 'November 7, 2025',
      description:
        'A sweeping collection confronting the paradox: how can we harness AI for global sustainability without automating our own crises? Covers the environmental paradox of AI, algorithmic bias and decolonization, human-AI collaboration in Industry 5.0 and the arts, and the governance imperative.',
      amazonUrl: 'https://a.co/d/0fvKtbND',
      accent: 'violet',
    },
  ],
};

// Legacy export kept for backward compatibility with /verify certificates
// The 86 chapter certificates for Digital Symbiosis live in public/verify/certificate_data.jsonl
