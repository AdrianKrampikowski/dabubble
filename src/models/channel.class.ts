export class Channel {
    channelId: string;
    users: string[];
    channelName:string;
    description:string;
    author:string;


  constructor(obj?:any){
    this.channelId = obj ? obj.channelId : '';
    this.users = obj ? obj.id : [];
    this.channelName = obj ? obj.channelName : '';
    this.description = obj ? obj.channelDescription : '';
    this.author = obj ? obj.author : '';
  
  }

  public toJSON(){
      return{
        channelId: this.channelId,
        channelName: this.channelName,
        description: this.description,
        users: this.users,
        author: this.author,
      }
  }
}