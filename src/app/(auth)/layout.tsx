type Props = { children: React.ReactNode }

export default async function LayoutLogin({ children }: Props) {
  return (
    <div
      className={`bg-[url(../../public/images/backgroundLogin.png)] bg-cover w-screen h-screen flex justify-center items-center`}
    >
      {children}
    </div>
  )
}
