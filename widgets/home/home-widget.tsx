'use client'

import { ko } from '@/shared/lib/i18n'
import { FADE_UP, MOTION_DURATION, STAGGER } from '@/shared/constant/motion'
import { HOME_FEATURES } from '@/shared/constant/marketing'
import { Button } from '@/shared/ui/button'
import { motion } from 'framer-motion'
import Link from 'next/link'
import type { FC } from 'react'

const fadeUp = FADE_UP
const stagger = STAGGER

export const HomeWidget: FC = () => {
    return (
        <div className='min-h-screen bg-background'>
            <nav className='fixed top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm'>
                <div className='mx-auto flex h-14 max-w-5xl items-center justify-between px-6'>
                    <Link href='/' className='text-lg font-bold tracking-tight'>
                        bcalendar
                    </Link>
                    <div className='flex items-center gap-4'>
                        <Link href='/about' className='text-sm text-muted-foreground hover:text-foreground'>
                            {ko.about}
                        </Link>
                        <Button asChild variant='ghost' size='sm'>
                            <Link href='/login'>{ko.getStarted}</Link>
                        </Button>
                    </div>
                </div>
            </nav>

            <motion.section
                variants={stagger}
                initial='initial'
                animate='animate'
                className='flex min-h-screen flex-col items-center justify-center px-6 text-center'>
                <motion.p variants={fadeUp} transition={{ duration: MOTION_DURATION }} className='text-sm font-medium text-muted-foreground'>
                    CalDAV · ICS · 오픈 스탠다드
                </motion.p>
                <motion.h1
                    variants={fadeUp}
                    transition={{ duration: MOTION_DURATION }}
                    className='mt-4 max-w-2xl text-4xl font-bold tracking-tight sm:text-6xl'>
                    당신의 시간을
                    <br />
                    <span className='text-primary'>깔끔하게</span>
                </motion.h1>
                <motion.p variants={fadeUp} transition={{ duration: MOTION_DURATION }} className='mt-6 max-w-md text-lg text-muted-foreground'>
                    드래그로 일정을 옮기고, 늘리고, 관리하세요. CalDAV로 어디서든 동기화됩니다.
                </motion.p>
                <motion.div variants={fadeUp} transition={{ duration: MOTION_DURATION }} className='mt-10 flex gap-3'>
                    <Button asChild size='lg'>
                        <Link href='/login'>{ko.startFree}</Link>
                    </Button>
                    <Button asChild variant='outline' size='lg'>
                        <Link href='/about'>{ko.learnMore}</Link>
                    </Button>
                </motion.div>
            </motion.section>

            <motion.section
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.8 }}
                className='mx-auto max-w-5xl px-6 pb-32'>
                <div className='grid gap-8 sm:grid-cols-3'>
                    {HOME_FEATURES.map((feature, i) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1, duration: 0.5 }}
                            className='rounded-xs border p-6'>
                            <h3 className='font-semibold'>{feature.title}</h3>
                            <p className='mt-2 text-sm text-muted-foreground'>{feature.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </motion.section>

            <footer className='border-t py-8 text-center text-xs text-muted-foreground'>
                <p>&copy; 2026 bcalendar</p>
            </footer>
        </div>
    )
}
