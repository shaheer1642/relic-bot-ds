export interface IAuthUser {
    user_id: string;
    ingame_name: string;
    username: string;
    avatar: string;
    email: string;
    password: string;
    discord_id: string;
    discord_profile: {
        username: string;
        discriminator: string;
        avatar: string;
    };
}

// TODO: fix types
