const { getTodayStartMs, getWeekStartMs, getMonthStartMs, dynamicSortDesc, getWeekEndMs, relicBotSquadToString } = require("../functions")

function allsquadsLeaderboardsGenerate(req) {
    const rep_scheme = req.rep_scheme
    const data = req.data
    const db_users = req.db_users
    const db_squads = req.db_squads
    const db_giveaways = req.db_giveaways
    const db_blessings = req.db_blessings
    const db_daywave_challenges = req.db_daywave_challenges
    const db_users_ratings = req.db_users_ratings

    var statistics = {
        all_time: [],
        this_month: [],
        this_week: [],
        today: [],
        top_squads: {},
        total_squads: 0,
        top_runners: {
            relic_runners: [],
            non_relic_runners: [],
            squad_runners: [],
            event_runners: [],
        },
    }
    const today_start = getTodayStartMs()
    const week_start = getWeekStartMs()
    const month_start = getMonthStartMs()
    const top_runners_start_ts = data.options?.top_runners?.start_timestamp || getWeekStartMs()
    const top_runners_end_ts = data.options?.top_runners?.end_timestamp || getWeekEndMs()

    db_squads.forEach(squad => {
        if (squad.open_timestamp >= week_start) {
            if (!squad.squad_string) 
                squad.squad_string = (relicBotSquadToString(squad,false,true)).toLowerCase().replace(/ /g,'_')
            if (!statistics.top_squads[squad.squad_string]) 
                statistics.top_squads[squad.squad_string] = 0
            statistics.top_squads[squad.squad_string]++
            statistics.total_squads++
        }
        squad.members.filter(id => !squad.invalidated_members?.includes(id)).forEach(member_id => {
            const userIndex = db_users.findIndex(u => u.user_id == member_id)
            if (userIndex == -1) return
            if (!db_users[userIndex].squads_filled) db_users[userIndex].squads_filled = []
            db_users[userIndex].squads_filled.push(squad)
        })
    })
    db_giveaways.forEach(giveaway => {
        const userIndex = db_users.findIndex(u => u.user_id == giveaway.user_id)
        if (userIndex == -1) return
        if (!db_users[userIndex].giveaways_hosted) db_users[userIndex].giveaways_hosted = []
        db_users[userIndex].giveaways_hosted.push(giveaway)
    })
    db_blessings.forEach(blessing => {
        const userIndex = db_users.findIndex(u => u.user_id == blessing.user_id)
        if (userIndex == -1) return
        if (!db_users[userIndex].blessings_hosted) db_users[userIndex].blessings_hosted = []
        db_users[userIndex].blessings_hosted.push(blessing)
    })
    db_daywave_challenges.forEach(daywave_challenge => {
        const userIndex = db_users.findIndex(u => u.user_id == daywave_challenge.user_id)
        if (userIndex == -1) return
        if (!db_users[userIndex].challenges_completed) db_users[userIndex].challenges_completed = []
        db_users[userIndex].challenges_completed.push(daywave_challenge)
    })
    db_users_ratings.forEach(user_rating => {
        const userIndex = db_users.findIndex(u => u.user_id == user_rating.rated_user)
        if (userIndex == -1) return
        if (!db_users[userIndex].ratings_received) db_users[userIndex].ratings_received = []
        db_users[userIndex].ratings_received.push(user_rating)
    })
    db_users.forEach(user => {
        const user_id = user.user_id
        if (!user_id || user_id == "0") return
        if (data.options?.skip_users?.includes(user_id)) return
        var reputation = {
            all_time: 0.0,
            this_month: 0.0,
            this_week: 0.0,
            today: 0.0
        }
        user.last_squad_timestamp = 0
        const squads_count = {squads: 0, relic_squads: 0, non_relic_squads: 0, event_squads: 0}
        user.squads_filled?.forEach(squad => {
            const rep = rep_scheme[squad.bot_type]
            reputation.all_time += rep
            if (squad.open_timestamp >= today_start) reputation.today += rep
            if (squad.open_timestamp >= week_start) reputation.this_week += rep
            if (squad.open_timestamp >= month_start) reputation.this_month += rep
            if (squad.open_timestamp > user.last_squad_timestamp ) user.last_squad_timestamp = squad.open_timestamp
            
            if (squad.open_timestamp > top_runners_start_ts && squad.open_timestamp < top_runners_end_ts && !user.is_staff && !user.is_admin) {
                squads_count.squads++
                if (squad.bot_type == 'relicbot') squads_count.relic_squads++
                if (squad.bot_type == 'squadbot') squads_count.non_relic_squads++
                
                if (squad.bot_type == 'relicbot') squads_count.event_squads++  
                if (squad.bot_type == 'squadbot' && (squad.squad_string.toLowerCase().replace(/_/g,' ').match(/\btraces\b/) || squad.squad_string.toLowerCase().replace(/_/g,' ').match(/\btrace\b/))) squads_count.event_squads++
            }
        })
        user.giveaways_hosted?.forEach(giveaway => {
            const rep = rep_scheme.giveaway
            reputation.all_time += rep
        })
        user.blessings_hosted?.forEach(blessing => {
            const rep = rep_scheme.blessing
            reputation.all_time += rep
        })
        user.challenges_completed?.forEach(daywave_challenge => {
            const rep = rep_scheme.daywave_completion
            reputation.all_time += rep
            if (daywave_challenge.timestamp >= today_start) reputation.today += rep 
            if (daywave_challenge.timestamp >= week_start) reputation.this_week += rep
            if (daywave_challenge.timestamp >= month_start) reputation.this_month += rep
        })
        user.ratings_received?.forEach(user_rating => {
            const rep = rep_scheme.rating[user_rating.rating]
            reputation.all_time += rep
        })
        if (reputation.all_time > 0) statistics.all_time.push({ discord_id: user.discord_id, user_id: user.user_id, ingame_name: user.ingame_name, reputation: reputation.all_time, last_squad_timestamp: user.last_squad_timestamp })
        if (reputation.today > 0) statistics.today.push({ discord_id: user.discord_id, user_id: user.user_id, ingame_name: user.ingame_name, reputation: reputation.today, last_squad_timestamp: user.last_squad_timestamp })
        if (reputation.this_week > 0) statistics.this_week.push({ discord_id: user.discord_id, user_id: user.user_id, ingame_name: user.ingame_name, reputation: reputation.this_week, last_squad_timestamp: user.last_squad_timestamp })
        if (reputation.this_month > 0) statistics.this_month.push({ discord_id: user.discord_id, user_id: user.user_id, ingame_name: user.ingame_name, reputation: reputation.this_month, last_squad_timestamp: user.last_squad_timestamp })
        if (squads_count.relic_squads > 0) statistics.top_runners.relic_runners.push({ discord_id: user.discord_id, user_id: user.user_id, ingame_name: user.ingame_name, squads_count: squads_count.relic_squads, last_squad_timestamp: user.last_squad_timestamp })
        if (squads_count.non_relic_squads > 0) statistics.top_runners.non_relic_runners.push({ discord_id: user.discord_id, user_id: user.user_id, ingame_name: user.ingame_name, squads_count: squads_count.non_relic_squads, last_squad_timestamp: user.last_squad_timestamp })
        if (squads_count.squads > 0) statistics.top_runners.squad_runners.push({ discord_id: user.discord_id, user_id: user.user_id, ingame_name: user.ingame_name, squads_count: squads_count.squads, last_squad_timestamp: user.last_squad_timestamp })
        if (squads_count.event_squads > 0) statistics.top_runners.event_runners.push({ discord_id: user.discord_id, user_id: user.user_id, ingame_name: user.ingame_name, squads_count: squads_count.event_squads, last_squad_timestamp: user.last_squad_timestamp })
    })
    statistics.all_time = statistics.all_time.sort(dynamicSortDesc("reputation"))
    statistics.today = statistics.today.sort(dynamicSortDesc("reputation"))
    statistics.this_week = statistics.this_week.sort(dynamicSortDesc("reputation"))
    statistics.this_month = statistics.this_month.sort(dynamicSortDesc("reputation"))
    statistics.top_runners.relic_runners = statistics.top_runners.relic_runners.sort(dynamicSortDesc("squads_count"))
    statistics.top_runners.non_relic_runners = statistics.top_runners.non_relic_runners.sort(dynamicSortDesc("squads_count"))
    statistics.top_runners.squad_runners = statistics.top_runners.squad_runners.sort(dynamicSortDesc("squads_count"))
    statistics.top_runners.event_runners = statistics.top_runners.event_runners.sort(dynamicSortDesc("squads_count"))
    statistics.top_squads = Object.keys(statistics.top_squads).map(squad_string => ({squad_string: squad_string, hosts: statistics.top_squads[squad_string]})).sort(dynamicSortDesc("hosts"))
    if (data.options?.limit) {
        statistics.all_time = statistics.all_time.map((o,index) => index < data.options.limit ? o:null).filter(o => o != null)
        statistics.today = statistics.today.map((o,index) => index < data.options.limit ? o:null).filter(o => o != null)
        statistics.this_week = statistics.this_week.map((o,index) => index < data.options.limit ? o:null).filter(o => o != null)
        statistics.this_month = statistics.this_month.map((o,index) => index < data.options.limit ? o:null).filter(o => o != null)
        statistics.top_squads = statistics.top_squads.map((o,index) => index < data.options.limit ? o:null).filter(o => o != null)
        statistics.top_runners.relic_runners = statistics.top_runners.relic_runners.map((o,index) => index < data.options.limit ? o:null).filter(o => o != null)
        statistics.top_runners.non_relic_runners = statistics.top_runners.non_relic_runners.map((o,index) => index < data.options.limit ? o:null).filter(o => o != null)
        statistics.top_runners.squad_runners = statistics.top_runners.squad_runners.map((o,index) => index < data.options.limit ? o:null).filter(o => o != null)
        statistics.top_runners.event_runners = statistics.top_runners.event_runners.map((o,index) => index < data.options.limit ? o:null).filter(o => o != null)
    }
    data.options?.exclude_stats?.forEach(stat => {
        if (statistics[stat]) delete statistics[stat]
    })

    return statistics
}

process.on('message', (req) => {
    console.log('[child-functions.js] Starting child process', req.func)

    if(req.func === 'allsquadsLeaderboardsGenerate') {
        process.send({res: allsquadsLeaderboardsGenerate(req.data)});
    } else {
        console.error('[child-functions.js] Function',req.func,'does not exist')
        process.send({err: `Function ${req.func} does not exist`});
    }
});