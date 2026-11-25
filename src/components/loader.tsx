/** `light`: for dark surfaces, such as a page over a photo. */
function Loader({className, tone = 'default'}:{className?: string; tone?: 'default' | 'light'}) {
  const colors = tone === 'light' ? 'border-t-white/20 border-b-amber-300' : 'border-t-background border-b-primary'
  return (
    <div className={`${className ? className : 'w-6 h-6'} `}>
      <div className={`w-full h-full border-t-3 border-b-3 ${colors} rounded-full animate-spin`}>
      </div>
    </div>
  )
}

export default Loader