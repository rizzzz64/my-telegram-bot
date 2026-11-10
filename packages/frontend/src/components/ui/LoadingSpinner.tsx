import { motion } from 'framer-motion'

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div className="flex items-center justify-center">
      <motion.div
        className={`${sizes[size]} border-2 border-accent-purple/30 border-t-accent-purple rounded-full`}
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-6xl"
      >
        🎁
      </motion.div>
      <LoadingSpinner size="lg" />
      <p className="text-text-secondary text-sm">Загрузка GiftForge...</p>
    </div>
  )
}
