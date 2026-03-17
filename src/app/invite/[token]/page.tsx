import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { userId } = await auth()
  const { token } = await params

  const invite = await prisma.invite.findUnique({
    where: { token },
    include: { org: true },
  })

  if (!invite || invite.accepted || invite.expiresAt < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0E0B1E' }}>
        <div className="text-center max-w-md p-8 rounded-2xl" style={{ background: '#16122A', border: '1px solid #2A2450' }}>
          <p className="text-4xl mb-4">⚠</p>
          <h1 className="text-xl font-bold mb-2" style={{ color: '#F0EEFF' }}>Invalid Invite</h1>
          <p className="text-sm mb-6" style={{ color: '#8B7EC8' }}>
            This invite link has expired or already been used.
          </p>
          <Link href="/">
            <button className="px-4 py-2 rounded-lg text-sm font-medium text-white"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)' }}>
              Go to FlowLens
            </button>
          </Link>
        </div>
      </div>
    )
  }

  // If not logged in, redirect to sign-up with invite token
  if (!userId) {
    redirect(`/sign-up?invite=${token}`)
  }

  // Accept the invite — add user to org
  const existingMember = await prisma.member.findFirst({
    where: { clerkUserId: userId, orgId: invite.orgId },
  })

  if (!existingMember) {
    await prisma.member.create({
      data: {
        clerkUserId: userId,
        orgId: invite.orgId,
        role: invite.role,
      },
    })
  }

  await prisma.invite.update({
    where: { token },
    data: { accepted: true },
  })

  redirect('/dashboard?joined=true')
}