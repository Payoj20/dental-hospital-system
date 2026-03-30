//Redis cache key name is here
//Changing a key format in one place updates the entire app

export const RedisKeys={
    //Availability slots for a doctor on a given date
    //ttl: 5 min- slot data changes when appointments are booked or canceled

    slots: (doctorId: string, date: string) => `slots:${doctorId}:${date}` as const,

    //version/sync key for admin dashboard auto-refresh
    //store latest updates. Check every 8sec by admin page
    //ttl: 24hrs - auto expires at the end of day

    sync: (doctorId: string, date: string) => `sync:${doctorId}:${date}` as const,

    //Full doctor list for admin dropdown
    //ttl 10min - doctor rarely change
    doctorList: () => "doctors:list" as const,

    //Rate limiting key for booking endpoint per user
    //Key: user firebase UID, ttl: 1min sliding window
    bookingRateLimit: (uid: string) => `ratelimit:booking:${uid}` as const,

};

//ttl values in seconds
export const TTL={
    slots: 60*5,
    sync: 60*60*24,
    doctorList: 60*10,
    bookingRateLimit: 60,
} as const;