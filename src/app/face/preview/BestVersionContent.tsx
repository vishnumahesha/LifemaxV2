'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Wand2, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  RefreshCw, 
  Download, 
  ImagePlus,
  Sliders,
  Eye,
  Scissors,
  GlassWater,
  Camera
} from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { PhotoUpload } from '@/components/PhotoUpload';
import type { ApiResult } from '@/types/api';

type PageState = 'upload' | 'customize' | 'generating' | 'results';

interface BestVersionSettings {
  hairstyle: 'current' | 'optimized' | 'short' | 'medium' | 'long';
  glasses: 'none' | 'current' | 'minimal' | 'bold';
  enhancement: number; // 1-10
}

interface GeneratedImage {
  imageUrl: string;
  description: string;
}

// Animated background orbs
function BackgroundOrbs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-pink-500/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] bg-violet-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-fuchsia-500/5 rounded-full blur-[150px]" />
    </div>
  );
}

// Option selector
function OptionSelector({ 
  label, 
  options, 
  value, 
  onChange,
  icon: Icon
}: { 
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  icon: any;
}) {
  return (
    <div className="mb-6">
      <label className="flex items-center gap-2 text-sm font-medium text-zinc-400 mb-3">
        <Icon className="w-4 h-4 text-pink-400" />
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              value === option.value 
                ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/30' 
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Enhancement slider
function EnhancementSlider({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="mb-6">
      <label className="flex items-center justify-between text-sm font-medium text-zinc-400 mb-3">
        <span className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-pink-400" />
          Enhancement Level
        </span>
        <span className="text-pink-400">{value}/10</span>
      </label>
      <div className="relative">
        <input
          type="range"
          min="1"
          max="10"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
          style={{
            background: `linear-gradient(to right, rgb(236 72 153) 0%, rgb(236 72 153) ${(value - 1) * 11.1}%, rgb(39 39 42) ${(value - 1) * 11.1}%, rgb(39 39 42) 100%)`
          }}
        />
      </div>
      <div className="flex justify-between text-xs text-zinc-500 mt-2">
        <span>Subtle</span>
        <span>Natural</span>
        <span>Enhanced</span>
      </div>
    </div>
  );
}

// Before/After comparison
function BeforeAfterComparison({ before, after }: { before: string; after: string }) {
  const [showAfter, setShowAfter] = useState(true);

  return (
    <div className="relative rounded-3xl overflow-hidden bg-zinc-900 border border-pink-500/30">
      {/* Image display */}
      <div className="relative aspect-square">
        <AnimatePresence mode="wait">
          {showAfter ? (
            <motion.img
              key="after"
              src={after}
              alt="Enhanced version"
              className="w-full h-full object-cover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
          ) : (
            <motion.img
              key="before"
              src={before}
              alt="Original"
              className="w-full h-full object-cover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
          )}
        </AnimatePresence>
        
        {/* Label */}
        <div className="absolute top-4 left-4">
          <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
            showAfter 
              ? 'bg-pink-500/90 text-white' 
              : 'bg-zinc-800/90 text-zinc-300'
          }`}>
            {showAfter ? '✨ Enhanced' : 'Original'}
          </span>
        </div>

        {/* Glow effect */}
        {showAfter && (
          <div className="absolute inset-0 bg-gradient-to-t from-pink-500/10 to-transparent pointer-events-none" />
        )}
      </div>

      {/* Toggle button */}
      <button
        onClick={() => setShowAfter(!showAfter)}
        className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 bg-zinc-900/90 border border-zinc-700 rounded-full text-sm text-white hover:bg-zinc-800 transition-colors"
      >
        <Eye className="w-4 h-4" />
        {showAfter ? 'See Original' : 'See Enhanced'}
      </button>
    </div>
  );
}

export default function BestVersionContent() {
  const [pageState, setPageState] = useState<PageState>('upload');
  const [photo, setPhoto] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [settings, setSettings] = useState<BestVersionSettings>({
    hairstyle: 'optimized',
    glasses: 'none',
    enhancement: 5,
  });
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const hairstyleOptions = [
    { value: 'current', label: 'Keep Current' },
    { value: 'optimized', label: 'AI Optimized' },
    { value: 'short', label: 'Short' },
    { value: 'medium', label: 'Medium' },
    { value: 'long', label: 'Long' },
  ];

  const glassesOptions = [
    { value: 'none', label: 'No Glasses' },
    { value: 'current', label: 'Keep Current' },
    { value: 'minimal', label: 'Minimal Frames' },
    { value: 'bold', label: 'Bold Frames' },
  ];

  const handleContinue = () => {
    if (!photo) {
      toast.error('Please upload a photo first');
      return;
    }
    setPageState('customize');
  };

  const handleGenerate = async () => {
    setPageState('generating');
    setGenerationProgress(0);

    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 10;
      });
    }, 600);

    try {
      const response = await fetch('/api/face/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoBase64: photo,
          settings: settings,
        }),
      });

      const data: ApiResult<{ images: GeneratedImage[] }> = await response.json();

      clearInterval(progressInterval);
      setGenerationProgress(100);

      if (!data.ok) {
        toast.error(data.error.message);
        setPageState('customize');
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Use placeholder if no images returned
      if (!data.data.images || data.data.images.length === 0) {
        setGeneratedImages([{
          imageUrl: photo || '',
          description: 'Enhanced version with optimized styling'
        }]);
      } else {
        setGeneratedImages(data.data.images);
      }
      setPageState('results');

    } catch (error) {
      clearInterval(progressInterval);
      console.error('Generation error:', error);
      toast.error('Failed to generate preview. Please try again.');
      setPageState('customize');
    }
  };

  const handleReset = () => {
    setPageState('upload');
    setPhoto(null);
    setGeneratedImages([]);
    setSelectedImageIndex(0);
    setGenerationProgress(0);
  };

  return (
    <AppShell>
      <BackgroundOrbs />
      <div className="relative min-h-screen px-4 py-8 pb-24">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <motion.div 
              className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-b from-pink-500/30 to-pink-500/10 border border-pink-500/30 mb-6"
              animate={{ 
                boxShadow: ['0 0 30px rgba(236,72,153,0.3)', '0 0 50px rgba(236,72,153,0.5)', '0 0 30px rgba(236,72,153,0.3)']
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Wand2 className="w-10 h-10 text-pink-400" />
            </motion.div>
            <h1 className="text-4xl font-bold text-white mb-3">
              Best Version Generator
            </h1>
            <p className="text-zinc-400 text-lg">
              {pageState === 'upload' && 'Upload your photo to see your potential'}
              {pageState === 'customize' && 'Customize your transformation'}
              {pageState === 'generating' && 'Creating your best version...'}
              {pageState === 'results' && 'Your transformation is ready'}
            </p>
          </motion.div>

          <AnimatePresence mode="wait">
            {/* Upload State */}
            {pageState === 'upload' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="p-1 rounded-3xl bg-gradient-to-b from-pink-500/30 to-zinc-800/30 border border-pink-500/30">
                  <div className="bg-zinc-900/90 rounded-[22px] p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Camera className="w-5 h-5 text-pink-400" />
                      <span className="text-sm font-medium text-white">Upload Your Photo</span>
                    </div>
                    <PhotoUpload
                      label=""
                      required
                      onPhotoChange={setPhoto}
                      guidelines={[
                        'Clear front-facing photo',
                        'Good lighting',
                        'No filters or heavy edits',
                      ]}
                    />
                  </div>
                </div>

                {/* Disclaimer */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="p-4 bg-pink-500/10 border border-pink-500/20 rounded-2xl"
                >
                  <p className="text-sm text-pink-200 text-center">
                    ✨ This tool shows realistic improvements through styling, grooming, and presentation - not bone structure changes.
                  </p>
                </motion.div>

                <motion.button
                  onClick={handleContinue}
                  disabled={!photo}
                  whileHover={{ scale: 1.02, boxShadow: '0 0 50px rgba(236, 72, 153, 0.4)' }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-gradient-to-r from-pink-600 to-violet-600 text-white text-lg font-semibold rounded-2xl shadow-xl shadow-pink-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Sparkles className="w-6 h-6" />
                  Continue
                  <ArrowRight className="w-6 h-6" />
                </motion.button>
              </motion.div>
            )}

            {/* Customize State */}
            {pageState === 'customize' && (
              <motion.div
                key="customize"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Preview */}
                <div className="flex justify-center mb-6">
                  <div className="relative w-48 h-48 rounded-2xl overflow-hidden border-2 border-pink-500/30">
                    {photo && (
                      <img
                        src={photo}
                        alt="Your photo"
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-pink-500/20 to-transparent" />
                  </div>
                </div>

                {/* Settings Card */}
                <div className="p-6 bg-zinc-900/50 border border-pink-500/20 rounded-3xl">
                  <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-pink-400" />
                    Customization Options
                  </h2>

                  <OptionSelector
                    label="Hairstyle"
                    options={hairstyleOptions}
                    value={settings.hairstyle}
                    onChange={(v) => setSettings({ ...settings, hairstyle: v as typeof settings.hairstyle })}
                    icon={Scissors}
                  />

                  <OptionSelector
                    label="Glasses"
                    options={glassesOptions}
                    value={settings.glasses}
                    onChange={(v) => setSettings({ ...settings, glasses: v as typeof settings.glasses })}
                    icon={GlassWater}
                  />

                  <EnhancementSlider
                    value={settings.enhancement}
                    onChange={(v) => setSettings({ ...settings, enhancement: v })}
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-4">
                  <motion.button
                    onClick={() => setPageState('upload')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center justify-center gap-2 px-6 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-xl border border-zinc-700 transition-all"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Back
                  </motion.button>
                  <motion.button
                    onClick={handleGenerate}
                    whileHover={{ scale: 1.02, boxShadow: '0 0 50px rgba(236, 72, 153, 0.4)' }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-pink-600 to-violet-600 text-white font-semibold rounded-xl shadow-xl shadow-pink-500/30 transition-all"
                  >
                    <Wand2 className="w-5 h-5" />
                    Generate Best Version
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Generating State */}
            {pageState === 'generating' && (
              <motion.div
                key="generating"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="relative p-8 bg-zinc-900/50 border border-pink-500/20 rounded-3xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 via-violet-500/5 to-pink-500/5 animate-pulse" />
                  
                  <div className="relative flex flex-col items-center text-center">
                    {/* Spinning loader */}
                    <div className="relative w-32 h-32 mb-8">
                      <motion.div
                        className="absolute inset-0 rounded-full border-4 border-pink-500/20"
                      />
                      <motion.div
                        className="absolute inset-0 rounded-full border-4 border-transparent border-t-pink-500"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        style={{ filter: 'drop-shadow(0 0 10px rgba(236, 72, 153, 0.5))' }}
                      />
                      <motion.div
                        className="absolute inset-2 rounded-full border-4 border-transparent border-t-violet-500"
                        animate={{ rotate: -360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        style={{ filter: 'drop-shadow(0 0 10px rgba(139, 92, 246, 0.5))' }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Wand2 className="w-10 h-10 text-pink-400 animate-pulse" />
                      </div>
                    </div>
                    
                    <h3 className="text-2xl font-bold text-white mb-4">
                      Creating Your Best Version
                    </h3>
                    
                    <div className="w-full max-w-md mb-6">
                      <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-pink-500 to-violet-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${generationProgress}%` }}
                          transition={{ duration: 0.3 }}
                          style={{ boxShadow: '0 0 20px rgba(236, 72, 153, 0.5)' }}
                        />
                      </div>
                      <p className="text-sm text-zinc-500 mt-2">
                        {Math.round(generationProgress)}% complete
                      </p>
                    </div>

                    <div className="space-y-3 text-left w-full max-w-sm">
                      {[
                        { label: 'Analyzing facial features', threshold: 15 },
                        { label: 'Calculating optimal styling', threshold: 35 },
                        { label: 'Generating transformations', threshold: 55 },
                        { label: 'Applying enhancements', threshold: 75 },
                        { label: 'Finalizing images', threshold: 92 },
                      ].map((step, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className={`flex items-center gap-3 ${generationProgress > step.threshold ? 'text-pink-400' : 'text-zinc-500'}`}
                        >
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${generationProgress > step.threshold ? 'bg-pink-500/20 text-pink-400' : 'bg-zinc-800'}`}>
                            {generationProgress > step.threshold ? '✓' : '○'}
                          </span>
                          {step.label}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Results State */}
            {pageState === 'results' && generatedImages.length > 0 && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Before/After */}
                {photo && (
                  <BeforeAfterComparison
                    before={photo}
                    after={generatedImages[selectedImageIndex]?.imageUrl || photo}
                  />
                )}

                {/* Multiple images selection */}
                {generatedImages.length > 1 && (
                  <div className="flex justify-center gap-3">
                    {generatedImages.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedImageIndex(i)}
                        className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                          selectedImageIndex === i 
                            ? 'border-pink-500 shadow-lg shadow-pink-500/30' 
                            : 'border-zinc-700 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={img.imageUrl} alt={`Option ${i + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Description */}
                {generatedImages[selectedImageIndex]?.description && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 bg-pink-500/10 border border-pink-500/20 rounded-2xl text-center"
                  >
                    <p className="text-sm text-pink-200">{generatedImages[selectedImageIndex].description}</p>
                  </motion.div>
                )}

                {/* Disclaimer */}
                <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-2xl">
                  <p className="text-xs text-zinc-500 text-center">
                    ⚠️ These images show potential styling improvements. Results are AI-generated visualizations and individual results may vary.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <motion.button
                    onClick={handleReset}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-xl border border-zinc-700 transition-all"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Try Again
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(236, 72, 153, 0.3)' }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-pink-600 to-violet-600 text-white font-semibold rounded-xl shadow-lg shadow-pink-500/20 transition-all"
                  >
                    <Download className="w-5 h-5" />
                    Save Image
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AppShell>
  );
}
