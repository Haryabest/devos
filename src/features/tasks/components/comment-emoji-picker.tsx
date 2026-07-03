import EmojiPicker, { EmojiStyle, Theme } from 'emoji-picker-react';

interface CommentEmojiPickerProps {
  onPick: (emoji: string) => void;
}

export function CommentEmojiPicker({ onPick }: CommentEmojiPickerProps) {
  return (
    <EmojiPicker
      onEmojiClick={(data) => onPick(data.emoji)}
      emojiStyle={EmojiStyle.APPLE}
      theme={Theme.AUTO}
      width={320}
      height={380}
      searchPlaceholder="Поиск эмодзи"
      previewConfig={{ showPreview: false }}
      lazyLoadEmojis
      className="!border-0 !shadow-none"
    />
  );
}
