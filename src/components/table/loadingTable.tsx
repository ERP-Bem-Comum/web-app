import ReactLoading from 'react-loading'

export function LoadingTable() {
  return (
    <div
      className="flex justify-center items-center py-5"
      style={{ margin: 'auto', width: '100%' }}
    >
      <ReactLoading type={'spin'} color={'#32C6F4'} height={30} width={30} />
    </div>
  )
}
