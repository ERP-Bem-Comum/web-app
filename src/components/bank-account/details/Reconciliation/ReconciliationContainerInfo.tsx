const ContainerInfo = ({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) => {
  return <div className={`px-5 ${className}`}>{children}</div>
}

export default ContainerInfo
