import React, { useState, useEffect } from 'react';

interface CountdownProps {
    targetDate: string; // 目标日期，格式：'YYYY-MM-DD'
}

export const Countdown: React.FC<CountdownProps> = ({ targetDate }) => {
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
    });

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date().getTime();
            const target = new Date(targetDate).getTime();
            const difference = target - now;

            if (difference > 0) {
                const days = Math.floor(difference / (1000 * 60 * 60 * 24));
                const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((difference % (1000 * 60)) / 1000);

                setTimeLeft({ days, hours, minutes, seconds });
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    const TimeBox = ({ value, label }: { value: number; label: string }) => (
        <div className="text-center px-4">
            <div className="text-4xl font-light">
                {value.toString().padStart(2, '0')}
            </div>
            <div className="text-sm mt-1 text-gray-500">{label}</div>
        </div>
    );

    return (
        <div className="flex items-center justify-center">
            <TimeBox value={timeLeft.days} label="天" />
            <TimeBox value={timeLeft.hours} label="时" />
            <TimeBox value={timeLeft.minutes} label="分" />
            <TimeBox value={timeLeft.seconds} label="秒" />
        </div>
    );
}; 