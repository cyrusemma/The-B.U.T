'use client'

export default function CloudLayer() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-x-hidden"
    >
      <div className="page-cloud page-cloud-a" />
      <div className="page-cloud page-cloud-b" />
      <div className="page-cloud page-cloud-c" />
    </div>
  )
}
