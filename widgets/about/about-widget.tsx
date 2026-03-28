'use client'

import { ko } from '@/shared/lib/i18n'
import { FADE_UP, MOTION_DURATION, STAGGER } from '@/shared/constant/motion'
import { ABOUT_DETAILS } from '@/shared/constant/marketing'
import { Button } from '@/shared/ui/button'
import { motion } from 'framer-motion'
import Link from 'next/link'
import type { FC } from 'react'

const fadeUp = FADE_UP
const stagger = STAGGER

export const AboutWidget: FC = () => {
    return (
        <div className='min-h-screen bg-background'>
            <nav className='fixed top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm'>
                <div className='mx-auto flex h-14 max-w-5xl items-center justify-between px-6'>
                    <Link href='/' className='text-lg font-bold tracking-tight'>
                        bcalendar
                    </Link>
                    <div className='flex items-center gap-4'>
                        <Link href='/about' className='text-sm font-medium'>
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
                className='flex min-h-[60vh] flex-col items-center justify-center px-6 pt-14 text-center'>
                <motion.h1
                    variants={fadeUp}
                    transition={{ duration: MOTION_DURATION }}
                    className='max-w-2xl text-3xl font-bold tracking-tight sm:text-5xl'>
                    오픈 스탠다드 위에
                    <br />
                    세워진 캘린더
                </motion.h1>
                <motion.p variants={fadeUp} transition={{ duration: MOTION_DURATION }} className='mt-6 max-w-lg text-muted-foreground'>
                    bcalendar는 CalDAV와 ICS 표준을 기반으로 동작합니다. 특정 서비스에 종속되지 않고, 어떤 캘린더 앱과도 호환됩니다.
                </motion.p>
            </motion.section>

            <section className='mx-auto max-w-3xl space-y-24 px-6 pb-32'>
                {ABOUT_DETAILS.map((item) => (
                    <motion.div
                        key={item.title}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-50px' }}
                        transition={{ duration: MOTION_DURATION }}>
                        <h2 className='text-xl font-semibold'>{item.title}</h2>
                        <p className='mt-3 leading-relaxed text-muted-foreground'>{item.desc}</p>
                    </motion.div>
                ))}
            </section>

            <motion.section
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: MOTION_DURATION }}
                className='border-t py-20 text-center'>
                <h2 className='text-2xl font-bold'>{ko.tryNow}</h2>
                <p className='mt-3 text-muted-foreground'>{ko.freeToUse}</p>
                <Button asChild size='lg' className='mt-6'>
                    <Link href='/login'>{ko.startFree}</Link>
                </Button>
            </motion.section>

            <footer className='border-t py-8 text-center text-xs text-muted-foreground'>
                <p>&copy; 2026 bcalendar</p>
            </footer>
        </div>
    )
}
