import { Transacao } from "./Transacao.js";
import { GrupoTransacao } from "./GrupoTransacao.js";
import { TipoTransacao } from "./TipoTransacao.js";
import { Armazenador } from "./Armazenador.js";
import { ValidaDebito } from "./decorators.js";

class Conta {
    protected nome: string
    protected saldo: number = Armazenador.obter<number>('saldo') || 0;
    private transacoes: Transacao[] = Armazenador.obter<Transacao[]>(('transacoes'), (key:string, value: any) => {
        if (key === 'data') {
            return new Date(value);
        }
        else {
            return value
        }
    }) || [];

    constructor(nome: string) {
        this.nome = nome;
    }

    public getTitular () {
        return this.nome
    }

    public getGruposTransacoes(): GrupoTransacao[] {
        const gruposTransacoes: GrupoTransacao[] = [];
        const listaTransacoes: Transacao[] = structuredClone(this.transacoes);
        const transacoesOrdenadas: Transacao[] = listaTransacoes.sort((t1, t2) => t2.data.getTime() - t1.data.getTime());
        let labelAtualGrupoTransacao: string = "";

        for (let transacao of transacoesOrdenadas) {
            let labelGrupoTransacao: string = transacao.data.toLocaleDateString("pt-br", { month: "long", year: "numeric" });
            if (labelAtualGrupoTransacao !== labelGrupoTransacao) {
                labelAtualGrupoTransacao = labelGrupoTransacao;
                gruposTransacoes.push({
                    label: labelGrupoTransacao,
                    transacoes: []
                });
            }
            gruposTransacoes.at(-1).transacoes.push(transacao);
        }

        return gruposTransacoes;
    }
    

    public getSaldo() {
        return this.saldo;
    }

    public getDataAcesso(): Date {
        return new Date();
    }

    public registrarTransacao (novaTransacao: Transacao): void {
        this.transacoes.push(novaTransacao);
        console.log(this.getGruposTransacoes());
        Armazenador.salvar("transacoes", JSON.stringify(this.transacoes));
    }

    @ValidaDebito
    public debitar (valor: number): void {
        if (valor <= 0) {
            throw new Error("O valor a ser debitado deve ser maior que zero!");
        }
        if (valor > this.saldo) {
            throw new Error("Saldo insuficiente!");
        }
    
        this.saldo -= valor;
        Armazenador.salvar("saldo", this.saldo.toString());
    }
    @ValidaDeposito
    public depositar (valor: number): void {
        this.saldo += valor;
        Armazenador.salvar("saldo", this.saldo.toString());
    }
}

export class ContaPremium extends Conta{
    registrarTransacao (transacao: Transacao) : void {
        if (transacao.tipoTransacao == TipoTransacao.DEPOSITO) {
            console.log('Ganhou um bonus de R$ 0.50 !')
            transacao.valor += 0.5
        }
        super.registrarTransacao(transacao)
    }
}

const conta = new Conta ('Joana da Silva Oliveira');
const contapremium = new ContaPremium ('Mônica Hillman') 

export default Conta