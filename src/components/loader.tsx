function Loader({className}:{className?: string}) {
  return (
    <div className={`${className ? className : 'w-6 h-6'} `}>
      <div className="w-full h-full border-t-3 border-b-3 border-t-background border-b-primary rounded-full animate-spin">
      </div>
    </div>
  )
}

export default Loader