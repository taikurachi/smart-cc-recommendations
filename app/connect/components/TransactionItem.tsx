import { Transaction } from "@/lib/types";
import { TEXT_STYLES, CARD_STYLES } from "@/lib/styles";

interface TransactionItemProps {
  transaction: Transaction;
}

export default function TransactionItem({ transaction }: TransactionItemProps) {
  return (
    <div className={CARD_STYLES.TRANSACTION_ITEM}>
      <div className="flex-1">
        <p className={TEXT_STYLES.TRANSACTION_NAME}>{transaction.name}</p>
        <p className={TEXT_STYLES.TRANSACTION_DATE}>{transaction.date}</p>
      </div>
      <p
        className={
          transaction.amount < 0
            ? TEXT_STYLES.AMOUNT_NEGATIVE
            : TEXT_STYLES.AMOUNT_POSITIVE
        }
      >
        ${Math.abs(transaction.amount).toFixed(2)}
      </p>
    </div>
  );
}

