import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../../stores/appStore'

export function Notification() {
  const { notification } = useAppStore()

  const colors = {
    success: 'bg-green-500/20 border-green-500/50 text-green-400',
    error: 'bg-red-500/20 border-red-500/50 text-red-400',
    info: 'bg-purple-500/20 border-purple-500/50 text-purple-400',
  }

  const icons = { success: '✅', error: '❌', info: 'ℹ️' }

  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          className={`fixed top-4 left-4 right-4 z-50 p-4 rounded-xl border ${colors[notification.type]} flex items-center gap-3`}
          style={{ backdropFilter: 'blur(12px)' }}
        >
          <span className="text-xl">{icons[notification.type]}</span>
          <p className="text-sm font-medium">{notification.message}</p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
