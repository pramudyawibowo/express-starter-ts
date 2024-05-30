import { User } from "@prisma/client";

export default class UserResource {
    collection(Users: User[]): object[] {
        return Users.map((User) => {
            return this.transform(User);
        });
    }

    get(User: User): object {
        return this.transform(User);
    }

    transform(User: User): object {
        return {
            id: User.id,
            name: User.name,
            phonenumber: User.phonenumber,
        }
    }
}
