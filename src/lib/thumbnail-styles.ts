/**
 * YouTube Thumbnail Style definitions — used for AI prompt generation
 * and the style selector UI in the compose page.
 */

export interface ThumbnailStyle {
    id: string
    name: string
    description: string
    preview: string // path to preview image in /public/thumbnail-styles/
    promptTemplate: string // AI prompt template for this style
    tags: string[] // search tags
}

export const THUMBNAIL_STYLES: ThumbnailStyle[] = [
    {
        id: 'mrbeast',
        name: 'Mr. Beast / Viral',
        description: 'Bold text, exaggerated expressions, bright colors, action lines — maximum shock value',
        preview: '/thumbnail-styles/mrbeast.png',
        promptTemplate: 'Create a YouTube thumbnail in the Mr. Beast viral style: EXTREME bold yellow and red text with strong hook words, person with exaggerated shocked/surprised facial expression, bright colorful background with action lines radiating outward, highly saturated vivid colors, dramatic lighting, comic-style energy burst effects. The thumbnail must be eye-catching and impossible to scroll past. 16:9 aspect ratio, 1280x720px.',
        tags: ['viral', 'bold', 'reaction', 'shocking', 'entertainment'],
    },
    {
        id: 'cartoon',
        name: 'Cartoon / Illustrated',
        description: 'Vibrant hand-drawn cartoon look, playful characters, comic speech bubbles',
        preview: '/thumbnail-styles/cartoon.png',
        promptTemplate: 'Create a YouTube thumbnail in cartoon/illustrated style: vibrant hand-drawn cartoon illustrations, bold outlines, playful colorful characters, cel-shaded animation look, comic book speech bubbles with hook text, fun animated aesthetic. Bright saturated colors, clean cartoon linework. 16:9 aspect ratio, 1280x720px.',
        tags: ['cartoon', 'animated', 'illustration', 'fun', 'kids'],
    },
    {
        id: 'tech',
        name: 'Tech / Clean',
        description: 'Sleek dark backgrounds, blue gradients, product shots, MKBHD-inspired minimal aesthetic',
        preview: '/thumbnail-styles/tech.png',
        promptTemplate: 'Create a YouTube thumbnail in clean tech review style: sleek dark background with subtle blue/dark gradient, product or gadget prominently displayed, clean sans-serif white text, subtle grid lines or circuit patterns, futuristic glow effects, MKBHD-inspired minimal professional aesthetic. Premium product photography feel. 16:9 aspect ratio, 1280x720px.',
        tags: ['tech', 'review', 'product', 'clean', 'MKBHD', 'gadget'],
    },
    {
        id: 'cinematic',
        name: 'Cinematic / Movie Poster',
        description: 'Dramatic lighting, film grain, epic movie poster composition, Hollywood feel',
        preview: '/thumbnail-styles/cinematic.png',
        promptTemplate: 'Create a YouTube thumbnail in cinematic movie poster style: dramatic dark moody lighting, film grain texture, person in epic silhouette pose, golden hour or dark atmospheric background, bold serif movie title text, lens flare, Hollywood blockbuster aesthetic, letterbox composition. 16:9 aspect ratio, 1280x720px.',
        tags: ['cinematic', 'movie', 'dramatic', 'film', 'epic', 'documentary'],
    },
    {
        id: 'minimalist',
        name: 'Minimalist / Clean',
        description: 'White/light backgrounds, single element, lots of negative space, Apple-inspired elegance',
        preview: '/thumbnail-styles/minimalist.png',
        promptTemplate: 'Create a YouTube thumbnail in minimalist clean style: pure white or light gray background, single centered object or icon, lots of negative space, thin elegant sans-serif typography, Apple-inspired premium aesthetic, soft subtle shadows, understated sophistication. 16:9 aspect ratio, 1280x720px.',
        tags: ['minimalist', 'clean', 'simple', 'elegant', 'lifestyle', 'business'],
    },
    {
        id: 'gaming',
        name: 'Gaming / Esports',
        description: 'Neon purple/green, RGB glow effects, gaming controller elements, esports energy',
        preview: '/thumbnail-styles/gaming.png',
        promptTemplate: 'Create a YouTube thumbnail in gaming/esports style: neon purple, green, and blue colors, gaming elements, bold glitch-effect text, RGB lighting glow, splatter effects, esports tournament energy, dynamic action composition, pixel art accents. 16:9 aspect ratio, 1280x720px.',
        tags: ['gaming', 'esports', 'neon', 'gameplay', 'stream'],
    },
    {
        id: 'news',
        name: 'News / Documentary',
        description: 'Professional news broadcast layout, red banners, split-screen, journalist style',
        preview: '/thumbnail-styles/news.png',
        promptTemplate: 'Create a YouTube thumbnail in news/documentary broadcast style: professional news channel layout, red breaking news banner with bold white text, split screen or picture-in-picture composition, world map or cityscape background, formal journalist presentation aesthetic, CNN/BBC broadcast quality. 16:9 aspect ratio, 1280x720px.',
        tags: ['news', 'documentary', 'journalism', 'breaking', 'report', 'analysis'],
    },
    {
        id: 'luxury',
        name: 'Luxury / Gold',
        description: 'Black and gold, diamond sparkles, luxury brand aesthetic, high-end premium feel',
        preview: '/thumbnail-styles/luxury.png',
        promptTemplate: 'Create a YouTube thumbnail in luxury/gold premium style: black background with rich gold accents, elegant gold serif text, luxury brand aesthetic, gold leaf ornamental textures, diamond/crystal sparkle effects, high-end premium opulent design, Versace/luxury fashion inspired. 16:9 aspect ratio, 1280x720px.',
        tags: ['luxury', 'gold', 'premium', 'elegant', 'fashion', 'wealth'],
    },
    {
        id: 'neon',
        name: 'Neon / Cyberpunk',
        description: 'Dark city backdrop, neon pink/cyan glow, cyberpunk futuristic, Blade Runner vibes',
        preview: '/thumbnail-styles/neon.png',
        promptTemplate: 'Create a YouTube thumbnail in neon/cyberpunk style: dark urban city background, bright neon pink and cyan glowing text and elements, cyberpunk futuristic aesthetic, holographic effects, rain reflections on wet streets, Blade Runner inspired, synthwave vaporwave color palette. 16:9 aspect ratio, 1280x720px.',
        tags: ['neon', 'cyberpunk', 'futuristic', 'synthwave', 'vaporwave', 'night'],
    },
    {
        id: 'retro',
        name: 'Retro / 80s Synthwave',
        description: '80s sunset gradient, retro grid lines, palm trees, VHS nostalgia, outrun aesthetic',
        preview: '/thumbnail-styles/retro.png',
        promptTemplate: 'Create a YouTube thumbnail in retro 80s synthwave style: sunset gradient from orange to purple, retro perspective grid lines, palm tree silhouettes, bold retro chrome metallic text, outrun/synthwave aesthetic, VHS scanline effects, warm nostalgic tones. 16:9 aspect ratio, 1280x720px.',
        tags: ['retro', '80s', 'synthwave', 'outrun', 'vintage', 'nostalgia'],
    },
    {
        id: 'comic',
        name: 'Comic Book / Pop Art',
        description: 'Halftone dots, bold outlines, primary colors, speech bubbles, Roy Lichtenstein style',
        preview: '/thumbnail-styles/comic.png',
        promptTemplate: 'Create a YouTube thumbnail in comic book/pop art style: halftone dot patterns, bold black outlines, bright primary colors (red, blue, yellow), comic book speech bubbles with hook text, Ben-Day dots, Roy Lichtenstein pop art inspired, action explosion "POW" effects. 16:9 aspect ratio, 1280x720px.',
        tags: ['comic', 'pop art', 'halftone', 'manga', 'action'],
    },
    {
        id: 'gradient',
        name: 'Modern Gradient',
        description: 'Smooth gradient backgrounds, glassmorphism, floating 3D shapes, SaaS/startup aesthetic',
        preview: '/thumbnail-styles/gradient.png',
        promptTemplate: 'Create a YouTube thumbnail in modern gradient style: smooth purple-to-blue or multicolor gradient background, clean bold white sans-serif typography, floating glassmorphism elements, subtle 3D geometric shapes, modern SaaS/startup aesthetic, professional and trendy. 16:9 aspect ratio, 1280x720px.',
        tags: ['gradient', 'modern', 'glass', 'startup', 'SaaS', 'trendy'],
    },
    {
        id: '3d',
        name: '3D Render / Clay',
        description: 'Playful 3D rendered objects, clay/Pixar style, soft pastel lighting, isometric',
        preview: '/thumbnail-styles/3d.png',
        promptTemplate: 'Create a YouTube thumbnail in 3D render/clay style: colorful 3D clay-like or Pixar-quality rendered objects, isometric or centered composition, soft diffuse pastel lighting, playful yet professional 3D illustration, rounded shapes, warm friendly aesthetic. 16:9 aspect ratio, 1280x720px.',
        tags: ['3d', 'render', 'clay', 'pixar', 'isometric', 'playful'],
    },
]

export const DEFAULT_THUMBNAIL_STYLE_ID = 'mrbeast'
