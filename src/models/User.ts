import mongoose, { Document, Schema } from 'mongoose';

interface IUser extends Document {
  chatId: number;
  name: string;
}

const userSchema = new Schema<IUser>({
  chatId: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
});

const User = mongoose.model<IUser>('User', userSchema);

export default User;
