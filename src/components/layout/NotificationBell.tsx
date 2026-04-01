'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Bell } from 'lucide-react'
import Link from 'next/link'
import { Avatar } from '@/components/ui/Avatar'

interface NotificationItem {
    id: string
    type: string
    message: string
    isRead: boolean
    reviewId: string | null
    createdAt: string
    actor: {
        id: string
        username: string
        displayName: string
        avatarUrl: string | null
    }
}

export function NotificationBell() {
    const { data: session } = useSession()
    const [notifications, setNotifications] = useState<NotificationItem[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!session) return

        const fetchNotifications = async () => {
            try {
                const res = await fetch('/api/notifications')
                if (res.ok) {
                    const data = await res.json()
                    setNotifications(data.notifications)
                    setUnreadCount(data.unreadCount)
                }
            } catch (error) {
                console.error('Failed to fetch notifications:', error)
            }
        }

        fetchNotifications()
        // 30秒ごとにポーリング
        const interval = setInterval(fetchNotifications, 30000)
        return () => clearInterval(interval)
    }, [session])

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleMarkAllRead = async () => {
        try {
            await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            })
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
            setUnreadCount(0)
        } catch (error) {
            console.error('Failed to mark all as read:', error)
        }
    }

    const getNotificationLink = (notification: NotificationItem) => {
        if (notification.reviewId) {
            return `/reviews/${notification.reviewId}`
        }
        if (notification.type === 'follow') {
            return `/users/${notification.actor.id}`
        }
        return '#'
    }

    const formatTime = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diff = now.getTime() - date.getTime()
        const minutes = Math.floor(diff / 60000)
        const hours = Math.floor(diff / 3600000)
        const days = Math.floor(diff / 86400000)

        if (minutes < 1) return 'たった今'
        if (minutes < 60) return `${minutes}分前`
        if (hours < 24) return `${hours}時間前`
        if (days < 7) return `${days}日前`
        return date.toLocaleDateString('ja-JP')
    }

    if (!session) return null

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-neutral-500 hover:text-neutral-900 transition-colors"
                aria-label="通知"
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-neutral-200 shadow-lg z-50 animate-scale-in">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
                        <h3 className="text-sm font-medium text-neutral-900">通知</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-xs text-blue-600 hover:text-blue-700"
                            >
                                すべて既読にする
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                            notifications.map(notification => (
                                <Link
                                    key={notification.id}
                                    href={getNotificationLink(notification)}
                                    className={`block px-4 py-3 hover:bg-neutral-50 transition-colors border-b border-neutral-50 ${
                                        !notification.isRead ? 'bg-blue-50/50' : ''
                                    }`}
                                    onClick={() => setIsOpen(false)}
                                >
                                    <div className="flex items-start space-x-3">
                                        <Avatar
                                            src={notification.actor.avatarUrl}
                                            fallback={notification.actor.displayName[0]}
                                            className="h-8 w-8 flex-shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-neutral-700 line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-neutral-400 mt-1">
                                                {formatTime(notification.createdAt)}
                                            </p>
                                        </div>
                                        {!notification.isRead && (
                                            <span className="flex-shrink-0 h-2 w-2 rounded-full bg-blue-500 mt-1.5" />
                                        )}
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="px-4 py-8 text-center text-sm text-neutral-500">
                                通知はありません
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
